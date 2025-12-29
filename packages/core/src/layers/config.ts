import { Path } from "@effect/platform";
import {
  type SourceDocsConfig,
  SourceDocsConfigSchema,
} from "@sourcedocs/shared";
import { loadConfig as c12LoadConfig } from "c12";
import {
  Context,
  Data,
  Effect,
  Either,
  Layer,
  ParseResult,
  Schema,
} from "effect";

export class SourcedocsConfig extends Context.Tag("SourcedocsConfig")<
  SourcedocsConfig,
  SourceDocsConfig
>() {}

export type LoadConfigOptions = {
  configFile?: string;
  overrides?: Partial<SourceDocsConfig>;
};

class ConfigError extends Data.TaggedError("ConfigError")<{
  message: string;
  error: unknown;
}> {}

const loadConfigC12 = (cwd: string, options: LoadConfigOptions) => {
  return Effect.tryPromise({
    catch: (error) => {
      const err = error as Error;
      console.error(err.message);
      return new ConfigError({ error, message: "Failed to load config" });
    },
    try: () => {
      return c12LoadConfig({
        configFile: options.configFile,
        cwd,
        dotenv: true,
        globalRc: true,
        name: "sourcedocs",
        overrides: options.overrides,
        rcFile: ".sourcedocsrc",
      });
    },
  });
};

const resolveConfigInternal = (options: LoadConfigOptions) =>
  Effect.gen(function* () {
    const path = yield* Path.Path;
    const cwd = path.resolve(".");

    // Load via C12
    const { config: rawConfig } = yield* loadConfigC12(cwd, options);

    console.log(rawConfig);

    // Validate via Schema
    const result = Schema.decodeUnknownEither(SourceDocsConfigSchema)(
      rawConfig || {},
    );

    if (Either.isLeft(result)) {
      const errorMsg = ParseResult.TreeFormatter.formatErrorSync(result.left);
      yield* Effect.logError(errorMsg);
      return yield* Effect.fail("error");
    }

    const validatedConfig = result.right;

    // Normalization logic
    const finalConfig: SourceDocsConfig = {
      ...validatedConfig,
      root: validatedConfig.root
        ? path.resolve(cwd, validatedConfig.root)
        : cwd,
    };

    return finalConfig;
  });

export const SourcedocsConfigLayer = (options: LoadConfigOptions) =>
  Layer.effect(SourcedocsConfig, resolveConfigInternal(options));
