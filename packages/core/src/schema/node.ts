import { Schema } from "effect";

import { AbsPathSchema, NodeIdSchema } from "./branded";
import { SupportedLanguage } from "./config";

const SourceLocation = Schema.Struct({
  absolutePath: AbsPathSchema,
  endLine: Schema.Number,
  fileId: Schema.String,
  language: SupportedLanguage,
  startLine: Schema.Number,
}).pipe(
  Schema.filter((loc) => loc.startLine <= loc.endLine, {
    message: () => "startLine must be <= endLine",
  }),
);

const NodeMetadata = Schema.Struct({
  contentHash: Schema.String,
  pluginData: Schema.optionalWith(
    Schema.Record({
      key: Schema.String,
      value: Schema.Unknown,
    }),
    { default: () => ({}) },
  ),
  source: SourceLocation,

  ui: Schema.optionalWith(
    Schema.Record({
      key: Schema.String,
      value: Schema.Unknown,
    }),
    { default: () => ({}) },
  ),
});

const NodeAttributes = Schema.Record({
  key: Schema.String,
  value: Schema.Unknown,
});

export const DocNodeSchema = Schema.Struct({
  attributes: NodeAttributes,
  children: Schema.Array(NodeIdSchema),
  id: NodeIdSchema,
  metadata: Schema.optional(NodeMetadata),
  parentId: Schema.optional(NodeIdSchema),
  type: Schema.String,
});

export type DocNode = typeof DocNodeSchema.Type;
