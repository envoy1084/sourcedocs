import { Context, Effect, Layer, Option } from "effect";

import { detectLanguage } from "@/helpers/file";
import type { SupportedLanguage } from "@/schema";

import { SourcedocsConfig } from "./config";

export type CommentSyntax = {
  start: string;
  end?: string;
};

export class SyntaxService extends Context.Tag("SyntaxService")<
  SyntaxService,
  {
    getStripper: (
      lang: SupportedLanguage,
    ) => (line: string) => Option.Option<string>;
  }
>() {}

export const SyntaxLive = Layer.effect(
  SyntaxService,
  Effect.gen(function* (_) {
    const config = yield* SourcedocsConfig;

    const tokenMap = new Map<SupportedLanguage, CommentSyntax>();

    for (const [ext, token] of Object.entries(config.parsing.commentTokens)) {
      const lang = detectLanguage(ext);
      tokenMap.set(lang, { start: token });
    }

    const getStripper = (lang: SupportedLanguage) => {
      const syntax = tokenMap.get(lang) || { start: "///" }; // Default

      return (line: string) => {
        const trimmed = line.trim();

        // Fast fail
        if (!trimmed.startsWith(syntax.start)) return Option.none();

        // Strip start token
        let content = trimmed.slice(syntax.start.length);

        // Strip end token if exists (e.g. HTML)
        if (syntax.end && content.endsWith(syntax.end)) {
          content = content.slice(0, -syntax.end.length);
        }

        return Option.some(content.trim());
      };
    };

    return { getStripper };
  }),
);
