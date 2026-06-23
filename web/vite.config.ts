import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.{test,spec}.{ts,tsx,js,jsx}"], // só src
    exclude: ["node_modules", "dist", "e2e/**"], // nunca o e2e
  },
});
