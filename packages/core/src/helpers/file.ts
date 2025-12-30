import type { SupportedLanguage } from "@sourcedocs/shared";

export const detectLanguage = (ext: string): SupportedLanguage => {
  switch (ext.toLowerCase()) {
    case ".sol":
      return "solidity";
    case ".rs":
      return "rust";
    case ".ts":
    case ".tsx":
      return "typescript";
    case ".js":
    case ".jsx":
      return "javascript";
    case ".py":
      return "python";
    case ".go":
      return "go";
    case ".md":
    case ".mdx":
      return "markdown";
    case ".yml":
    case ".yaml":
      return "yaml";
    case ".json":
      return "json";
    default:
      return "plaintext";
  }
};
