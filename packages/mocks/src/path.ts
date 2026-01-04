import path from "node:path";

import { Path, TypeId } from "@effect/platform/Path";
import { Effect, Layer } from "effect";

import { MemFs } from "./memfs";

export const InMemoryPath = Layer.effect(
  Path,
  Effect.gen(function* () {
    const { cwd } = yield* MemFs;

    return Path.of({
      ...path.posix,

      fromFileUrl: (url) => Effect.sync(() => url.pathname),

      resolve: (...segments: string[]) => {
        return path.posix.resolve(cwd, ...segments);
      },

      toFileUrl: (path) => Effect.sync(() => new URL(`file://${path}`)),
      [TypeId]: TypeId,
    });
  }),
);
