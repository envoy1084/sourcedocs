import { InMemoryContext, type NestedDirectoryJSON } from "@sourcedocs/mocks";
import { Layer, pipe } from "effect";

import { CollectorLive } from "@/layers/collector";
import { type LoadConfigOptions, SourcedocsConfigLive } from "@/layers/config";
import { ParserLive } from "@/layers/parser";
import { PluginRegistryLive } from "@/layers/plugin-registry";
import { SyntaxLive } from "@/layers/syntax";

export const MockRuntime = (
  initialStructure?: NestedDirectoryJSON,
  cwd?: string,
  config?: LoadConfigOptions,
) => {
  return pipe(
    Layer.mergeAll(ParserLive, CollectorLive),
    Layer.provideMerge(PluginRegistryLive),
    Layer.provideMerge(SyntaxLive),
    Layer.provideMerge(SourcedocsConfigLive(config ?? {})),
    Layer.provideMerge(InMemoryContext.layer(initialStructure, cwd)),
  );
};
