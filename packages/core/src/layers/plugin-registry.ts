import { Context, Effect, HashMap, Layer, Ref } from "effect";

import type { CommandHandler, ParserPlugin } from "@/plugin/types";

export class PluginRegistry extends Context.Tag("PluginRegistry")<
  PluginRegistry,
  {
    /** Register a plugin */
    register: (plugin: ParserPlugin) => Effect.Effect<void>;

    /** * Get the optimized Command Map.
     * Flattened: { "snippet": Handler, "chapter": Handler }
     */
    getCommandMap: () => Effect.Effect<HashMap.HashMap<string, CommandHandler>>;
  }
>() {}

type RegistryState = {
  commands: HashMap.HashMap<string, CommandHandler>;
};

export const PluginRegistryLive = Layer.effect(
  PluginRegistry,
  Effect.gen(function* () {
    const stateRef = yield* Ref.make<RegistryState>({
      commands: HashMap.empty(),
    });

    const register = (plugin: ParserPlugin) =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        let newCommands = state.commands;

        for (const [cmd, handler] of Object.entries(plugin.commands)) {
          if (HashMap.has(newCommands, cmd)) {
            yield* Effect.log(
              `[PluginRegistry] Duplicate command found: ${cmd}`,
            );
          }
          newCommands = HashMap.set(newCommands, cmd, handler);
        }

        yield* Ref.update(stateRef, () => ({
          commands: newCommands,
        }));
      });

    const getCommandMap = () =>
      Ref.get(stateRef).pipe(Effect.map((s) => s.commands));

    return { getCommandMap, register };
  }),
);
