import type { FileSystem, KeyValueStore, Path } from "@effect/platform";
import { layerMemory as InMemoryKeyValueStore } from "@effect/platform/KeyValueStore";
import { Layer, pipe } from "effect";
import type { NestedDirectoryJSON } from "memfs";

import { InMemoryFileSystem } from "./fs";
import type { Glob } from "./glob";
import { GlobTest } from "./glob";
import { type MemFs, MemFsLive } from "./memfs";
import { InMemoryPath } from "./path";

export type InMemoryContext =
  | FileSystem.FileSystem
  | MemFs
  | Glob
  | KeyValueStore.KeyValueStore
  | Path.Path;

export function layer(
  initialStructure?: NestedDirectoryJSON,
  root?: string,
): Layer.Layer<InMemoryContext> {
  initialStructure = initialStructure ?? {};
  root = root ?? "/";

  return pipe(
    Layer.mergeAll(
      InMemoryPath,
      InMemoryFileSystem,
      InMemoryKeyValueStore,
      GlobTest,
    ),
    Layer.provideMerge(MemFsLive(initialStructure, root)),
  );
}
