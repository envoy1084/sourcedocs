import crypto from "node:crypto";

import { FileSystem, Path } from "@effect/platform";
import type { PlatformError } from "@effect/platform/Error";
import { Context, Effect, Layer, Schema, Stream } from "effect";

import { detectLanguage } from "@/helpers/file";
import { AbsPath, RawFile, RelPath } from "@/schema";

import { SourcedocsConfig } from "./config";
import { Glob, type GlobError } from "./glob";

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
    discoverFiles: () => Stream.Stream<
      RawFile,
      CollectionError | PlatformError | GlobError
    >;
  }
>() {}

export const CollectorLive = Layer.effect(
  Collector,
  Effect.gen(function* () {
    const config = yield* SourcedocsConfig;
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const glob = yield* Glob;
    const cwd = path.resolve(".");

    console.log("cwd", cwd);

    const includePatterns = Array.from(config.include);
    const excludePatterns = Array.from(config.exclude);

    const filePathStream = glob.globStream(includePatterns, {
      absolute: true,
      cwd: config.root ?? cwd,
      ignore: excludePatterns,
    });

    const fileStream = filePathStream.pipe(
      Stream.mapEffect(
        (filePath) =>
          Effect.gen(function* () {
            const absolutePath = AbsPath(filePath);
            const relativePath = RelPath(
              path.relative(config.root ?? cwd, absolutePath),
            );

            const extension = path.extname(absolutePath);
            const content = yield* fs.readFileString(absolutePath, "utf-8");
            const id = crypto.randomBytes(8).toString("hex");

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

    return Collector.of({
      discoverFiles: () => fileStream,
    });
  }),
);
