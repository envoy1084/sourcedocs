import type { Chunk, Option } from "effect";

import type { RawFile, SourceDocsConfig } from "@/schema";

/**
 * The "Pull" mechanism.
 * Allows plugins to consume lines at their own pace.
 */
export type LineCursor = {
  /** * Look at the current line without advancing.
   * Useful for checking "Are we at the end?"
   */
  peek(): Option.Option<string>;

  /** * Return the current line and advance the index +1.
   */
  next(): Option.Option<string>;

  /**
   * Consumes lines until the predicate returns true.
   * NOTE: Does NOT consume the line that triggered true.
   */
  takeUntil(predicate: (line: string) => boolean): Chunk.Chunk<string>;
};

/**
 * The read-only context passed to every command handler.
 */
export type ParserContext = {
  readonly config: SourceDocsConfig;
  readonly file: RawFile;
  /** The current line number where the directive was found */
  readonly startLine: number;
};
