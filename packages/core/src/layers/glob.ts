import { Context, Effect, Layer, Schema, Stream } from "effect";
import type { GlobOptionsWithFileTypesFalse } from "glob";
import { glob, globStream } from "glob";

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

export const GlobLive = Layer.effect(
  Glob,
  Effect.gen(function* () {
    const createGlobStream = (
      include: string | string[],
      opts?: GlobOptionsWithFileTypesFalse,
    ): Stream.Stream<string, GlobError> =>
      Stream.async((emit) => {
        const gs = globStream(include, opts ?? {});

        gs.on("data", (path: string) => {
          emit.single(path);
        });

        gs.on("error", (error) => {
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

    const createGlob = (
      include: string | string[],
      opts?: GlobOptionsWithFileTypesFalse,
    ) => {
      return Effect.tryPromise({
        catch: (error) => new GlobError({ error }),
        try: (signal) => glob(include, { signal, ...opts }),
      });
    };

    return { glob: createGlob, globStream: createGlobStream };
  }),
);
