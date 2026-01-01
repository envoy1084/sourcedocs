import { Layer, pipe } from "effect";
import type { NestedDirectoryJSON } from "memfs";

import { layer as mockFsLayer } from "./fs";
import { InMemoryPath } from "./path";

export const InMemoryContext = (
  initialStructure: NestedDirectoryJSON,
  cwd?: string,
) =>
  pipe(
    Layer.mergeAll(
      mockFsLayer(initialStructure, cwd ?? "/"),
      InMemoryPath(cwd ?? "/"),
    ),
  );
