import path from "node:path";

import { SourceDocsConfigSchema } from "@sourcedocs/shared";
import { Effect, JSONSchema } from "effect";
import fs from "fs-extra";

Effect.log("Building JSON schema");

const jsonSchema = JSONSchema.make(SourceDocsConfigSchema);

const JSON_SCHEMA_BASE_PATH = path.join(process.cwd(), "schemas");
const JSON_SCHEMA_PATH = path.join(process.cwd(), "schemas", "schema.json");

if (!fs.existsSync(JSON_SCHEMA_BASE_PATH)) {
  fs.mkdirSync(JSON_SCHEMA_BASE_PATH);
}

fs.writeFileSync(JSON_SCHEMA_PATH, JSON.stringify(jsonSchema, null, 2));

Effect.log("Successfully built JSON schema");
