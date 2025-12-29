import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";

import { SourcedocsConfig, SourcedocsConfigLive } from "./layers/config";

const program = Effect.gen(function* () {
  const config = yield* SourcedocsConfig;
  yield* Effect.log(config);
});

const runner = program.pipe(
  Effect.provide(SourcedocsConfigLive({})),
  Effect.provide(NodeContext.layer),
);

NodeRuntime.runMain(runner);
