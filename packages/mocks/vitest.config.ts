import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, mergeConfig } from "vitest/config";

import { shared } from "../../vitest.shared";

const config = defineConfig({
  plugins: [tsconfigPaths()],
});

export default mergeConfig(shared, config);
