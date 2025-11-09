import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: {
    build: true,
  },
  clean: true,
  outDir: "dist",
  external: ["react", "react-dom"],
  sourcemap: true,
});
