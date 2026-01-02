/** biome-ignore-all lint/complexity/noExcessiveLinesPerFunction: safe */

import { Path } from "@effect/platform";
import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";

import { InMemoryContext } from "../src";

describe("Mock Path", () => {
  it.effect("resolve: resolve to default cwd", () =>
    Effect.gen(function* () {
      const path = yield* Path.Path;

      const absPath = path.resolve("file.txt");

      expect(absPath).toBe("/file.txt");
    }).pipe(Effect.provide(InMemoryContext())),
  );

  it.effect("resolve: resolve to absolute path", () =>
    Effect.gen(function* () {
      const path = yield* Path.Path;

      const absPath = path.resolve("/abc.txt");

      expect(absPath).toBe("/abc.txt");
    }).pipe(Effect.provide(InMemoryContext())),
  );

  it.effect("toFileUrl: create a url", () =>
    Effect.gen(function* () {
      const path = yield* Path.Path;

      const absPath = path.resolve("file.txt");

      const url = yield* path.toFileUrl(absPath);

      expect(url.toString()).toBe("file:///file.txt");
    }).pipe(Effect.provide(InMemoryContext())),
  );

  it.effect("fromFileUrl: return a filename", () =>
    Effect.gen(function* () {
      const path = yield* Path.Path;
      const absPath = path.resolve("file.txt");
      const url = yield* path.toFileUrl(absPath);
      const back = yield* path.fromFileUrl(url);

      expect(back).toBe(absPath);
    }).pipe(Effect.provide(InMemoryContext())),
  );
});
