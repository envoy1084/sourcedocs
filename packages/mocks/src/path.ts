import path from "node:path";

import { Path, TypeId } from "@effect/platform/Path";
import { Effect, Layer } from "effect";

export const InMemoryPath = (root: string) =>
  Layer.succeed(
    Path,
    Path.of({
      ...path.posix,

      fromFileUrl: (url) => Effect.sync(() => url.pathname),

      resolve: (...segments: string[]) => {
        return path.posix.resolve(root, ...segments);
      },

      toFileUrl: (path) => Effect.sync(() => new URL(`file://${path}`)),

      [TypeId]: TypeId,
    }),
  );
