import { Layer } from "effect";
import type { NestedDirectoryJSON } from "memfs";

import { layer as mockFsLayer } from "./fs";
import { InMemoryPath } from "./path";

export const InMemoryContext = (
  initialStructure: NestedDirectoryJSON,
  cwd?: string,
) =>
  Layer.mergeAll(
    mockFsLayer(initialStructure, cwd ?? "/"),
    InMemoryPath(cwd ?? "/"),
  );
