import { Schema } from "effect";

import { AbsPathSchema, RelPathSchema } from "./branded";
import { SupportedLanguage } from "./config";

// A raw file discovered on disk
export const RawFile = Schema.Struct({
  content: Schema.String,
  extension: Schema.String,
  id: Schema.String,
  language: SupportedLanguage,
  path: AbsPathSchema,
  relativePath: RelPathSchema,
});

export type RawFile = typeof RawFile.Type;
