import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  unbundle: true,
  dts: {
    build: true,
    resolve: true,
  },
  clean: true,
  outDir: "dist",
  external: ["react", "react-dom"],
  sourcemap: true,
});
