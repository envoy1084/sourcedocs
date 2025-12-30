import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Effect, Stream } from "effect";

import { Collector, CollectorLive } from "./layers/collector";
import { SourcedocsConfigLive } from "./layers/config";

export * from "@sourcedocs/shared";

const program = Effect.gen(function* () {
  const collector = yield* Collector;

  const stream = yield* collector.discoverFiles();

  const files = yield* Stream.runCollect(stream);

  yield* Effect.log(files);
});

const runnable = program.pipe(
  Effect.provide(CollectorLive),
  Effect.provide(
    SourcedocsConfigLive({
      overrides: {
        include: ["**/*.json"],
      },
    }),
  ),
  Effect.provide(NodeContext.layer),
);

NodeRuntime.runMain(runnable);
