import { Schema } from "effect";

export const AdapterType = Schema.Literal(
  "docusaurus",
  "gitbook",
  "fumadocs",
  "markdown",
  "json",
).annotations({ title: "AdapterType" });

export const SupportedLanguage = Schema.Literal(
  "solidity",
  "rust",
  "typescript",
  "python",
  "go",
  "plaintext",
  "markdown",
  "javascript",
  "yaml",
  "json",
).annotations({ title: "SupportedLanguage" });

export const ValidationMode = Schema.Literal(
  "strict",
  "warn",
  "ignore",
).annotations({ title: "ValidationMode" });

const URLSchema = Schema.String.pipe(
  Schema.pattern(
    /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/,
  ),
);

/**
 * Metadata about the project itself.
 * Critical for generating "Edit on GitHub" links and SEO tags.
 */
export const ProjectConfig = Schema.Struct({
  /** * Branch name for edit links.
   * @default "main"
   */
  branch: Schema.optionalWith(Schema.String, {
    default: () => "main",
  }).annotations({ default: "main" }),

  /** Project name (used in titles)
   * @default "Documentation"
   */
  name: Schema.optionalWith(Schema.String, {
    default: () => "Documentation",
  }).annotations({ default: "Documentation" }),

  /** * The base URL of the repository.
   *
   * @default "https://github.com/envoy1084/sourcedocs"
   */
  repository: Schema.optionalWith(
    URLSchema.annotations({
      message: () => "Invalid repository URL",
      title: "Repository",
    }),
    {
      default: () => "https://github.com/envoy1084/sourcedocs",
    },
  ).annotations({ default: "https://github.com/envoy1084/sourcedocs" }),
}).annotations({ title: "ProjectConfig" });

/**
 * Configuration for the output artifacts.
 */
export const OutputConfig = Schema.Struct({
  /** The target platform adapter.
   * @default "markdown"
   */
  adapter: Schema.optionalWith(AdapterType, {
    default: () => "markdown" as const,
  }).annotations({ default: "markdown" }),

  /** Clean the output directory before building?
   * @default true
   */
  clean: Schema.optionalWith(Schema.Boolean, {
    default: () => true,
  }),

  /** Directory where generated docs will be placed.
   * @default "docs"
   */
  dir: Schema.optionalWith(Schema.String, {
    default: () => "docs",
  }),
  /**
   * Generate a sitemap.xml file?
   * @default false
   */
  sitemap: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
}).annotations({ title: "OutputConfig" });

/**
 * Rules for parsing source code.
 */
export const ParsingConfig = Schema.Struct({
  /**
   * Define what constitutes a "doc comment" in specific files.
   * @example { ".py": "#" }
   * @default {}
   */
  commentTokens: Schema.optionalWith(
    Schema.Record({
      key: Schema.String,
      value: Schema.String,
    }),
    {
      default: () => ({}),
    },
  ).annotations({ default: {} }),

  /**
   * If true, regular markdown files (.md) in the source tree
   * are treated as chapters and included in the graph.
   * @default true
   */
  includeMarkdown: Schema.optionalWith(Schema.Boolean, {
    default: () => true,
  }),

  /**
   * Interpolation pattern for variable injection.
   * @default ["{{", "}}"]
   */
  interpolation: Schema.optionalWith(
    Schema.Tuple(Schema.String, Schema.String),
    {
      default: () => ["{{", "}}"] as const,
    },
  ).annotations({
    default: ["{{", "}}"],
  }),

  /**
   * Custom mapping of file extensions to language parsers.
   * @example { ".move": "rust" }
   * @default {}
   */
  languageMap: Schema.optionalWith(
    Schema.Record({
      key: Schema.String,
      value: SupportedLanguage,
    }),
    {
      default: () => ({}),
    },
  ).annotations({ default: {} }),
}).annotations({ title: "ParsingConfig" });

/**
 * Validation rules to ensure documentation integrity.
 */
export const ValidationConfig = Schema.Struct({
  /** Fail if a `@link: id` points to nowhere.
   * @default "strict"
   */
  brokenLinks: Schema.optionalWith(ValidationMode, {
    default: () => "strict",
  }).annotations({ default: "strict" }),

  /** Fail if a snippet ID is defined twice.
   * @default "strict"
   */
  duplicateIds: Schema.optionalWith(ValidationMode, {
    default: () => "strict",
  }).annotations({ default: "strict" }),

  /** Fail if a Chapter has no content/sections.
   * @default "warn"
   */
  emptyChapters: Schema.optionalWith(ValidationMode, {
    default: () => "warn",
  }).annotations({ default: "warn" }),

  /** Fail if a file matches 'include' but has no parsing tags.
   * @default "ignore"
   */
  unparsedFiles: Schema.optionalWith(ValidationMode, {
    default: () => "ignore",
  }).annotations({ default: "ignore" }),
}).annotations({ title: "ValidationConfig" });

export const SourceDocsConfigSchema = Schema.Struct({
  /**
   * List of glob patterns to exclude.
   * @default ["**\/node_modules\/**", "**\/.git\/**", "**\/dist\/**"]
   */
  exclude: Schema.optionalWith(Schema.Array(Schema.String), {
    default: () => ["**/node_modules/**", "**/.git/**", "**/dist/**"],
  }).annotations({
    default: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
  }),

  /**
   * List of glob patterns to include.
   * @example ["contracts/**\/*.sol", "scripts/*.ts"]
   * @default []
   */
  include: Schema.optionalWith(Schema.Array(Schema.String), {
    default: () => [],
  }).annotations({
    description: "Glob patterns for source files to scan.",
  }),

  /** Output settings */
  output: Schema.optionalWith(OutputConfig, {
    default: () => ({
      adapter: "markdown",
      clean: true,
      dir: "docs",
      sitemap: false,
    }),
  }),

  /** Parsing behavior settings */
  parsing: Schema.optionalWith(ParsingConfig, {
    default: () => ({
      commentTokens: {},
      includeMarkdown: true,
      interpolation: ["{{", "}}"],
      languageMap: {},
    }),
  }),

  /**
   * Plugins definitions.
   * We accept:
   * 1. String: "my-plugin" (resolved from node_modules)
   * 2. Object: { name: "my-plugin", options: {} } (Safer for some configs)
   * @default []
   */
  plugins: Schema.optionalWith(
    Schema.Array(
      Schema.Union(
        Schema.String, // "@sourcedocs/plugin-mermaid"
        Schema.Struct({
          name: Schema.String,
          options: Schema.optional(
            Schema.Record({ key: Schema.String, value: Schema.Any }),
          ),
        }),
      ),
    ),
    {
      default: () => [],
    },
  ),

  /** Project metadata.*/
  project: Schema.optionalWith(ProjectConfig, {
    default: () => ({
      branch: "main",
      name: "Documentation",
      repository: "https://github.com/envoy1084/sourcedocs",
    }),
  }),

  /**
   * The root directory of the project.
   *
   * @default "."
   */
  root: Schema.optionalWith(Schema.String, {
    default: () => ".",
  }).annotations({
    description: "Root directory for resolving paths. Defaults to CWD.",
  }),

  /** Validation strictness */
  validation: Schema.optionalWith(ValidationConfig, {
    default: () => ({
      brokenLinks: "strict",
      duplicateIds: "strict",
      emptyChapters: "warn",
      unparsedFiles: "ignore",
    }),
  }),
}).annotations({ title: "SourceDocsConfig" });

export type AdapterType = typeof AdapterType.Type;
export type SupportedLanguage = typeof SupportedLanguage.Type;
export type ValidationMode = typeof ValidationMode.Type;
export type ProjectConfig = typeof ProjectConfig.Type;
export type OutputConfig = typeof OutputConfig.Type;
export type ParsingConfig = typeof ParsingConfig.Type;
export type ValidationConfig = typeof ValidationConfig.Type;

export type UserConfig = typeof SourceDocsConfigSchema.Encoded;
export type SourceDocsConfig = typeof SourceDocsConfigSchema.Type;
