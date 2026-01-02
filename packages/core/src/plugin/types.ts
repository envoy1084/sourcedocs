import type { Effect, Option, Schema } from "effect";

import type { DocNode } from "@/schema";

import type { LineCursor, ParserContext } from "../parser/types";

/**
 * A Handler for a specific directive (e.g. @snippet).
 * T = The type of the arguments.
 */
export type CommandHandler<T = any> = {
  /** * Validation Schema for arguments.
   * e.g. @snippet id="abc" -> { id: string }
   */
  args: Schema.Schema<T>;

  /** * The Logic.
   * Returns Option.None if no node was created (side-effect only).
   */
  run: (ctx: {
    cursor: LineCursor;
    context: ParserContext;
    args: T; // Strictly typed!
  }) => Effect.Effect<Option.Option<DocNode>>;
};

/**
 * The Public Interface for a Parser Plugin.
 */
export type ParserPlugin = {
  readonly name: string;
  readonly version: string;

  /**
   * The Command Dictionary.
   * Core uses this for O(1) lookups during parsing.
   */
  readonly commands: Record<string, CommandHandler>;
};
