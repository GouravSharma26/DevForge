import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    setupFiles: ["./test/setup.ts"],
    env: {
      COOKIE_SECRET: "test-environment-cookie-secret-very-long-32-chars",
      JWT_SECRET: "test-environment-jwt-secret-very-long-32-chars",
    }
  }
})
