import { FileSystem, Path } from "@effect/platform";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Effect, JSONSchema } from "effect";

import { SourceDocsConfigSchema } from "@/schema";

const program = Effect.gen(function* () {
  const path = yield* Path.Path;
  const fs = yield* FileSystem.FileSystem;

  const cwd = path.resolve(".");

  const JSON_SCHEMA_BASE_PATH = path.join(cwd, "dist");
  const JSON_SCHEMA_PATH = path.join(JSON_SCHEMA_BASE_PATH, "schema.json");

  const dirExists = yield* fs.exists(JSON_SCHEMA_BASE_PATH);

  if (!dirExists) {
    yield* fs.makeDirectory(JSON_SCHEMA_BASE_PATH);
  }

  const jsonSchema = JSONSchema.make(SourceDocsConfigSchema);

  const data = Buffer.from(JSON.stringify(jsonSchema, null, 2), "utf-8");

  yield* fs.writeFile(JSON_SCHEMA_PATH, data);
  yield* Effect.log("Built JSON schema");
});

const runner = program.pipe(Effect.provide(NodeContext.layer));
NodeRuntime.runMain(runner);
