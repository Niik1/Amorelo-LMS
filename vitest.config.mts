import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Fase 0 — Configuración mínima de Vitest (tests unitarios en tests/unit).
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/unit/**/*.test.{ts,tsx}"],
  },
});
