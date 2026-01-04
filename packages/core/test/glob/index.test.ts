import path from "node:path";

import { NodeContext } from "@effect/platform-node";
import { describe, expect, layer } from "@effect/vitest";
import { Effect, Layer, Stream } from "effect";

import { Glob, GlobLive } from "@/layers/glob";

const Dirname = path.dirname(new URL(import.meta.url).pathname);
const fixturesPath = path.resolve(Dirname, "../fixtures/glob");

const GlobTestRuntime = GlobLive.pipe(Layer.provideMerge(NodeContext.layer));

describe("Glob Tests", () => {
  layer(GlobTestRuntime)((it) => {
    it.effect("glob: should glob files from root", () =>
      Effect.gen(function* () {
        const glob = yield* Glob;

        const res = yield* glob.glob(["**/*.ts"], {
          cwd: fixturesPath,
        });

        expect(res.length).toBe(3);
      }),
    );

    it.effect("glob: should glob files from nested dir", () =>
      Effect.gen(function* () {
        const glob = yield* Glob;

        const res = yield* glob.glob(["**/*.ts"], {
          cwd: path.join(fixturesPath, "dir"),
        });

        expect(res.length).toBe(2);
      }),
    );

    it.effect("glob: should glob multiple patterns", () =>
      Effect.gen(function* () {
        const glob = yield* Glob;

        const res = yield* glob.glob(["**/*.ts", "**/*.json"], {
          cwd: fixturesPath,
        });

        expect(res.length).toBe(4);
      }),
    );

    it.effect("globStream: should glob files from root", () =>
      Effect.gen(function* () {
        const glob = yield* Glob;

        const stream = glob.globStream(["**/*.ts"], {
          cwd: fixturesPath,
        });

        const res = yield* Stream.runCollect(stream);

        expect(res.length).toBe(3);
      }),
    );

    it.effect("globStream: should glob files from nested dir", () =>
      Effect.gen(function* () {
        const glob = yield* Glob;

        const stream = glob.globStream(["**/*.ts"], {
          cwd: path.join(fixturesPath, "dir"),
        });

        const res = yield* Stream.runCollect(stream);

        expect(res.length).toBe(2);
      }),
    );

    it.effect("globStream: should glob multiple patterns", () =>
      Effect.gen(function* () {
        const glob = yield* Glob;

        const stream = glob.globStream(["**/*.ts", "**/*.json"], {
          cwd: fixturesPath,
        });

        const res = yield* Stream.runCollect(stream);

        expect(res.length).toBe(4);
      }),
    );
  });
});
