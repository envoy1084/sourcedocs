import { describe, it } from "@effect/vitest";
import { Chunk, Effect, Stream } from "effect";
import { MockRuntime } from "test/shared";

import { Glob } from "@/layers/glob";

const initialStructure = {
  "a.ts": "hello",
  dir: {
    "b.ts": "hello again",
  },
};

describe("Glob Tests", () => {
  it.effect("should glob files", () =>
    Effect.gen(function* () {
      const glob = yield* Glob;

      const fileStream = glob.globStream(["**/*.ts"], {
        cwd: "/",
      });

      const res = yield* Stream.runCollect(fileStream);
      console.log(Chunk.toArray(res));
    }).pipe(Effect.provide(MockRuntime(initialStructure))),
  );
});
