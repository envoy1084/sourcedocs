/** biome-ignore-all lint/style/noNonNullAssertion: safe */
import { Chunk, Option } from "effect";

import type { LineCursor } from "./types";

export class LineCursorImpl implements LineCursor {
  private index: number;
  private readonly lines: string[];

  constructor(lines: string[], startIndex = 0) {
    this.lines = lines;
    this.index = startIndex;
  }

  peek(): Option.Option<string> {
    if (this.index >= this.lines.length) {
      return Option.none();
    }
    return Option.some(this.lines[this.index]!);
  }

  next(): Option.Option<string> {
    if (this.index >= this.lines.length) {
      return Option.none();
    }
    return Option.some(this.lines[this.index++]!);
  }

  takeUntil(predicate: (line: string) => boolean): Chunk.Chunk<string> {
    let buffer = Chunk.empty<string>();

    while (this.index < this.lines.length) {
      const line = this.lines[this.index]!;

      // If predicate matches, we STOP (we do NOT consume the triggering line)
      if (predicate(line)) {
        break;
      }

      buffer = Chunk.append(buffer, line);
      this.index++;
    }

    return buffer;
  }

  /**
   * Internal helper for the Engine to sync state
   */
  get currentIndex() {
    return this.index;
  }
}
