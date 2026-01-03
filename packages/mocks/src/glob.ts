import { Context, Effect, Layer, Schema, Stream } from "effect";
import type { GlobOptionsWithFileTypesFalse } from "glob";
import { type FSOption, glob, globStream } from "glob";

import { MemFs } from "./memfs";

export class GlobError extends Schema.TaggedError<GlobError>()("GlobError", {
  error: Schema.Unknown,
}) {}

export class Glob extends Context.Tag("Glob")<
  Glob,
  {
    globStream: (
      include: string | string[],
      opts?: GlobOptionsWithFileTypesFalse,
    ) => Stream.Stream<string, GlobError>;
    glob: (
      include: string | string[],
      opts?: GlobOptionsWithFileTypesFalse,
    ) => Effect.Effect<string[], GlobError>;
  }
>() {}

export const GlobTest = Layer.effect(
  Glob,
  Effect.gen(function* () {
    const { fs, cwd } = yield* MemFs;

    const commonGlobOpts: GlobOptionsWithFileTypesFalse = {
      cwd,
      fs: fs as unknown as FSOption,
      withFileTypes: false,
    };

    const createGlobStream = (
      include: string | string[],
      opts?: GlobOptionsWithFileTypesFalse,
    ): Stream.Stream<string, GlobError> => {
      return Stream.async((emit) => {
        const gs = globStream(include, {
          ...commonGlobOpts,
          ...opts,
        });

        gs.on("data", (path: string) => {
          emit.single(path);
        });

        gs.on("error", (error) => {
          console.log(error);
          emit.fail(
            new GlobError({
              error,
            }),
          );
        });

        gs.on("end", () => {
          emit.end();
        });
      });
    };

    const createGlob = (
      include: string | string[],
      opts?: GlobOptionsWithFileTypesFalse,
    ) => {
      return Effect.tryPromise({
        catch: (error) => new GlobError({ error }),
        try: (signal) =>
          glob(include, {
            signal,
            ...commonGlobOpts,
            ...opts,
          }),
      });
    };

    return { glob: createGlob, globStream: createGlobStream };
  }),
);
