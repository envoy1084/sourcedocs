import { describe, it } from "@effect/vitest";
import { Chunk, Effect, Stream } from "effect";
import { MockRuntime } from "test/shared";

import { Collector } from "@/layers/collector";

const initialStructure = {
  "a.ts": "hello",
  dir: {
    "b.ts": "hello again",
    nestedDir: {
      "c.ts": "hello again from c",
    },
  },
};

describe("Parser Tests", () => {
  it.effect("should glob files", () =>
    Effect.gen(function* () {
      const collector = yield* Collector;
      const fileStream = collector.discoverFiles();

      const res = yield* Stream.runCollect(fileStream);

      console.log(Chunk.toArray(res));
    }).pipe(
      Effect.provide(
        MockRuntime(initialStructure, "/", {
          overrides: {
            include: ["**/*.ts"],
          },
        }),
      ),
    ),
  );
});
