import { describe, expect, layer } from "@effect/vitest";
import { Effect, Stream } from "effect";

import { Glob } from "@/glob";
import { InMemoryContext } from "@/index";

const initialStructure = {
  "a.json": '{"hello": "world"}',
  "a.ts": "hello from a",
  dir: {
    "b.ts": "hello from b",
    nestedDir: {
      "c.ts": "hello from c",
    },
  },
};

describe("Glob Tests", () => {
  layer(InMemoryContext.layer(initialStructure))((it) => {
    it.effect("glob: should glob files from root", () =>
      Effect.gen(function* () {
        const glob = yield* Glob;

        const res = yield* glob.glob(["**/*.ts"]);

        expect(res.length).toBe(3);
      }),
    );

    it.effect("glob: should glob files from root", () =>
      Effect.gen(function* () {
        const glob = yield* Glob;

        const res = yield* glob.glob(["**/*.ts"]);

        expect(res.length).toBe(3);
      }),
    );

    it.effect("glob: should glob files from nested dir", () =>
      Effect.gen(function* () {
        const glob = yield* Glob;

        const res = yield* glob.glob(["**/*.ts"], {
          cwd: "/dir",
        });

        expect(res.length).toBe(2);
      }),
    );

    it.effect("glob: should glob multiple patterns", () =>
      Effect.gen(function* () {
        const glob = yield* Glob;

        const res = yield* glob.glob(["**/*.ts", "**/*.json"]);

        expect(res.length).toBe(4);
      }),
    );

    it.effect("globStream: should glob files from root", () =>
      Effect.gen(function* () {
        const glob = yield* Glob;

        const stream = glob.globStream(["**/*.ts"]);

        const res = yield* Stream.runCollect(stream);

        expect(res.length).toBe(3);
      }),
    );

    it.effect("globStream: should glob files from nested dir", () =>
      Effect.gen(function* () {
        const glob = yield* Glob;

        const stream = glob.globStream(["**/*.ts"], {
          cwd: "/dir",
        });

        const res = yield* Stream.runCollect(stream);

        expect(res.length).toBe(2);
      }),
    );

    it.effect("globStream: should glob multiple patterns", () =>
      Effect.gen(function* () {
        const glob = yield* Glob;

        const stream = glob.globStream(["**/*.ts", "**/*.json"]);

        const res = yield* Stream.runCollect(stream);

        expect(res.length).toBe(4);
      }),
    );
  });
});
