import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts"],
  format: ["esm"],
  minify: false,
  sourcemap: true,
  splitting: true,
  target: ["es2022"],
  treeshake: true,
});
