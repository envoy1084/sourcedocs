import { Brand, Schema } from "effect";

/**
 * Represents an Absolute Path (e.g., "/Users/anton/project/src/index.ts").
 * You cannot accidentally pass a relative path here.
 */
export type AbsPath = string & Brand.Brand<"AbsPath">;
export const AbsPath = Brand.nominal<AbsPath>();
export const AbsPathSchema = Schema.String.pipe(Schema.fromBrand(AbsPath));

/**
 * Represents a Relative Path from the project root (e.g., "src/index.ts").
 */
export type RelPath = string & Brand.Brand<"RelPath">;
export const RelPath = Brand.nominal<RelPath>();
export const RelPathSchema = Schema.String.pipe(Schema.fromBrand(RelPath));

/**
 * Unique Node ID (e.g., "src/index.ts:snippet_1").
 */
export type NodeId = string & Brand.Brand<"NodeId">;
export const NodeId = Brand.nominal<NodeId>();
export const NodeIdSchema = Schema.String.pipe(Schema.fromBrand(NodeId));
