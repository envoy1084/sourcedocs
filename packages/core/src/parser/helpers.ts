import { Option } from "effect";

export type DirectiveData = {
  fullMatch: string;
  command: string;
  rawArgs: string;
  args: Record<string, string | boolean | number>;
};

export const parseDirectiveLine = (
  line: string,
): Option.Option<DirectiveData> => {
  const trimmed = line.trim();

  if (!trimmed.startsWith("@")) return Option.none();

  // 2. Regex: Matches @command followed by optional space + args
  // Group 1: Command (alphanumeric + : + -)
  // Group 2: Arguments string (rest of line)
  const match = trimmed.match(/^@([\w:-]+)(?:\s+(.*))?$/);

  if (!match) return Option.none();

  const [, command, argsStr] = match;
  const safeArgsStr = argsStr || "";

  if (!command) return Option.none();

  return Option.some({
    args: parseArgsString(safeArgsStr),
    command,
    fullMatch: trimmed,
    rawArgs: safeArgsStr,
  });
};

/**
 * Standard Argument Parser (Key-Value + Flags)
 */
export function parseArgsString(input: string): DirectiveData["args"] {
  const args: Record<string, string | boolean | number> = {};

  // Regex: key="val" | key='val' | key=val | flag
  const regex = /([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;

  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: safe
  while ((match = regex.exec(input)) !== null) {
    const key = match[1];
    const value = match[2] ?? match[3] ?? match[4];

    if (!key) continue;

    if (value === undefined)
      args[key] = true; // Flag
    else if (value === "true") args[key] = true;
    else if (value === "false") args[key] = false;
    else if (value !== "" && !Number.isNaN(Number(value)))
      args[key] = Number(value);
    else args[key] = value;
  }

  return args;
}
