import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import type { ViteUserConfig } from "vitest/config";

const Dirname = dirname(fileURLToPath(import.meta.url));

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
    setupFiles: [path.join(Dirname, "vitest.setup.ts")],
    testTimeout: 20_000,
  },
};
