import {
  Chunk,
  Context,
  Effect,
  HashMap,
  Layer,
  Option,
  Schema,
  Stream,
} from "effect";
import type { ParseError } from "effect/ParseResult";

import { LineCursorImpl } from "@/parser/cursor";
import { parseDirectiveLine } from "@/parser/helpers";
import type { DocNode, RawFile } from "@/schema";

import { SourcedocsConfig } from "./config";
import { PluginRegistry } from "./plugin-registry";
import { SyntaxService } from "./syntax";

export class Parser extends Context.Tag("Parser")<
  Parser,
  {
    parseFile: (file: RawFile) => Stream.Stream<DocNode, ParseError>;
  }
>() {}

export const ParserLive = Layer.effect(
  Parser,
  Effect.gen(function* () {
    const registry = yield* PluginRegistry;
    const config = yield* SourcedocsConfig;
    const syntax = yield* SyntaxService;

    const commandMap = yield* registry.getCommandMap();

    const parseFile = (file: RawFile) => {
      const stripper = syntax.getStripper(file.language);
      const lines = file.content.split("\n");

      return Stream.unfoldEffect(new LineCursorImpl(lines), (cursor) =>
        Effect.gen(function* () {
          // A. EOF Check
          const peek = cursor.peek();
          if (Option.isNone(peek)) return Option.none();

          const rawLine = peek.value;
          const currentIndex = cursor.currentIndex;

          // Helper to skip 1 line (Default behavior)
          const skipLine = () => {
            cursor.next();
            return Option.some([Chunk.empty<DocNode>(), cursor] as const);
          };

          // B. Syntax Cleaning
          const cleaned = stripper(rawLine);
          if (Option.isNone(cleaned)) return skipLine(); // Not a comment

          // C. Directive Check (Using Helper)
          const directiveOpt = parseDirectiveLine(cleaned.value);
          if (Option.isNone(directiveOpt)) return skipLine(); // Not a directive

          const { command, args } = directiveOpt.value;

          // D. Plugin Resolution
          const handlerOpt = HashMap.get(commandMap, command);
          if (Option.isNone(handlerOpt)) {
            // Unknown directive? Just skip it.
            // (Optional: Log warning via config.logLevel)
            return skipLine();
          }

          const handler = handlerOpt.value;

          const safeArgs = yield* Schema.decodeUnknown(handler.args)(args);
          const result = yield* handler.run({
            args: safeArgs,
            context: {
              config,
              file,
              startLine: currentIndex,
            },
            cursor,
          });

          // F. Infinite Loop Guard
          // If the plugin didn't move the cursor, we MUST move it manually.
          if (cursor.currentIndex === currentIndex) {
            yield* Effect.logWarning("Infinite loop detected. Skipping line.");
            cursor.next();
          }

          // Return nodes
          const nodes = Option.isSome(result)
            ? Chunk.of(result.value)
            : Chunk.empty<DocNode>();

          return Option.some([nodes, cursor] as const);
        }),
      ).pipe(Stream.flattenChunks);
    };

    return { parseFile };
  }),
);
