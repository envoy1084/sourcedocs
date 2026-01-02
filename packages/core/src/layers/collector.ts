import { FileSystem, Path } from "@effect/platform";
import type { PlatformError } from "@effect/platform/Error";
import { Context, Effect, Layer, Schema, Stream } from "effect";
import { globStream } from "glob";

import { detectLanguage } from "@/helpers/file";
import { AbsPath, RawFile, RelPath } from "@/schema";

import { SourcedocsConfig } from "./config";

export class CollectionError extends Schema.TaggedError<CollectionError>()(
  "CollectionError",
  {
    error: Schema.Unknown,
    message: Schema.String,
    path: Schema.optional(Schema.String),
  },
) {}

export class Collector extends Context.Tag("CollectorService")<
  Collector,
  {
    /**
     * Discovers and reads files based on config.
     * Returns a Stream to handle large projects efficiently.
     */
    discoverFiles: () => Effect.Effect<
      Stream.Stream<RawFile, CollectionError | PlatformError>,
      never,
      SourcedocsConfig | FileSystem.FileSystem | Path.Path
    >;
  }
>() {}

const createFileStream = Effect.gen(function* () {
  const config = yield* SourcedocsConfig;
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const cwd = path.resolve(".");

  const filePathsStream: Stream.Stream<string, CollectionError> = Stream.async(
    (emit) => {
      const includePatterns = Array.from(config.include);
      const excludePatterns = Array.from(config.exclude);

      const gs = globStream(includePatterns, {
        absolute: true,
        cwd: config.root,
        ignore: excludePatterns,
        nodir: true,
      });

      gs.on("data", (path: string) => {
        emit.single(path);
      });

      gs.on("error", (error) => {
        emit.fail(
          new CollectionError({
            error,
            message: "Glob stream error",
          }),
        );
      });

      gs.on("end", () => {
        emit.end();
      });
    },
  );

  const fileStream = filePathsStream.pipe(
    Stream.mapEffect(
      (filePath) =>
        Effect.gen(function* () {
          const absolutePath = AbsPath(filePath);
          const relativePath = RelPath(
            path.relative(config.root ?? cwd, absolutePath),
          );

          const extension = path.extname(absolutePath);
          const content = yield* fs.readFileString(absolutePath, "utf-8");
          const id = crypto.randomUUID();

          const file = RawFile.make({
            content,
            extension,
            id,
            language: detectLanguage(extension),
            path: absolutePath,
            relativePath,
          });

          return file;
        }),
      { concurrency: 20 },
    ),
  );

  return fileStream;
});

export const CollectorLive = Layer.effect(
  Collector,
  Effect.succeed(
    Collector.of({
      discoverFiles: () => createFileStream,
    }),
  ),
);
