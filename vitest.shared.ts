import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import type { ViteUserConfig } from "vitest/config";

const Dirname = dirname(fileURLToPath(import.meta.url));

const isCI = process.env.CI === "true";

export const shared: ViteUserConfig = {
  esbuild: {
    target: "es2020",
  },
  test: {
    coverage: {
      enabled: true,
      exclude: [
        "**/*.test.*",
        "**/*.spec.*",
        "**/__tests__/**",
        "**/*.d.ts",
        "**/dist/**",
        "**/build/**",
        "**/.turbo/**",
        "**/node_modules/**",
      ],
      include: ["packages/**/src/**/*.{ts,tsx}", "apps/**/src/**/*.{ts,tsx}"],
      reporter: isCI ? ["json", "lcov"] : ["text", "html"],
      reportsDirectory: "coverage",
    },
    fakeTimers: {
      toFake: undefined,
    },
    hookTimeout: 20_000,
    include: ["test/**/*.test.ts"],
    passWithNoTests: false,
    sequence: {
      concurrent: true,
    },
    setupFiles: [path.join(Dirname, "vitest.setup.ts")],
    testTimeout: 20_000,
  },
};
