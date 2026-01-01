import { layerMemory as InMemoryKeyValueStore } from "@effect/platform/KeyValueStore";
import { Layer } from "effect";
import type { NestedDirectoryJSON } from "memfs";

import { InMemoryFileSystem } from "./fs";
import { InMemoryPath } from "./path";

export const InMemoryContext = (
  initialStructure: NestedDirectoryJSON,
  cwd?: string,
) =>
  Layer.mergeAll(
    InMemoryFileSystem(initialStructure, cwd ?? "/"),
    InMemoryPath(cwd ?? "/"),
    InMemoryKeyValueStore,
  );
