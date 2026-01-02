import type { Effect, Option, Schema } from "effect";

import type { DocNode } from "@/schema";

import type { LineCursor, ParserContext } from "../parser/types";
import type { CommandHandler, ParserPlugin } from "./types";

/**
 * Helper to define a single command.
 * Infers 'T' automatically from the Schema.
 */
export const defineCommand = <T>(
  argsSchema: Schema.Schema<T>,
  handler: (ctx: {
    cursor: LineCursor;
    context: ParserContext;
    args: T;
  }) => Effect.Effect<Option.Option<DocNode>>,
): CommandHandler<T> => ({
  args: argsSchema,
  run: handler,
});

/**
 * Helper to define a full plugin.
 * Ensures strict typing without abstract classes.
 */
export const defineParserPlugin = <
  // biome-ignore lint/suspicious/noExplicitAny: safe
  Commands extends Record<string, CommandHandler<any>>,
>(config: {
  name: string;
  version: string;
  commands: Commands;
}): ParserPlugin => {
  return {
    commands: config.commands,
    name: config.name,
    version: config.version,
  };
};
