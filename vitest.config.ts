import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  resolve: {
    alias: {
      "@flowkit-io/core": path.resolve(__dirname, "packages/core/src/index.ts"),
      "@flowkit-io/themes": path.resolve(__dirname, "packages/themes/src/index.ts"),
      "@flowkit-io/react": path.resolve(__dirname, "packages/react/src/index.tsx"),
      "@flowkit-io/adapters": path.resolve(__dirname, "packages/adapters/src/index.ts"),
      "@flowkit-io/presets": path.resolve(__dirname, "packages/presets/src/index.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["packages/*/src/**/*.test.{ts,tsx}"],
  },
})
