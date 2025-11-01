import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

// https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
  },
});
