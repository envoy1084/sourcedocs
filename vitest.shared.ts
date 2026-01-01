import path from "node:path";

import type { ViteUserConfig } from "vitest/config";

export const shared: ViteUserConfig = {
  esbuild: {
    target: "es2020",
  },
  test: {
    fakeTimers: {
      toFake: undefined,
    },
    hookTimeout: 20_000,
    include: ["test/**/*.test.ts"],
    sequence: {
      concurrent: true,
    },
    setupFiles: [path.join(__dirname, "vitest.setup.ts")],
    testTimeout: 20_000,
  },
};
