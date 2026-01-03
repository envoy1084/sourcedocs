/** biome-ignore-all lint/correctness/useYield: safe for this */
import { describe, expect, it } from "@effect/vitest";
import { Effect, Option } from "effect";

import { parseDirectiveLine } from "@/parser/helpers";

describe("Directive Parsing", () => {
  it.effect("should parse @command directive", () =>
    Effect.gen(function* () {
      const line = "@command";
      const res = parseDirectiveLine(line);

      expect(Option.isSome(res)).toBe(true);

      if (Option.isSome(res)) {
        const val = res.value;
        expect(val.command).toBe("command");
      }
    }),
  );

  it.effect("should parse @command directive with args", () =>
    Effect.gen(function* () {
      const line = `@command key1="val1" key2='val2' key3=val3 key4=10 key5=true key6=false`;
      const res = parseDirectiveLine(line);

      expect(Option.isSome(res)).toBe(true);

      if (Option.isSome(res)) {
        const val = res.value;
        expect(val.command).toBe("command");
        expect(val.args).toEqual({
          key1: "val1",
          key2: "val2",
          key3: "val3",
          key4: 10,
          key5: true,
          key6: false,
        });
      }
    }),
  );

  it.effect("should parse @command directive with flags", () =>
    Effect.gen(function* () {
      const line = `@command flag1 key1="val2" flag2`;
      const res = parseDirectiveLine(line);

      expect(Option.isSome(res)).toBe(true);

      if (Option.isSome(res)) {
        const val = res.value;
        expect(val.command).toBe("command");
        expect(val.args).toEqual({
          flag1: true,
          flag2: true,
          key1: "val2",
        });
      }
    }),
  );
});
