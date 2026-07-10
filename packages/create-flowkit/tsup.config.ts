import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/bin/create-flowkit.ts", "src/bin/flowkit-init.ts"],
  format: ["esm"],
  target: "node18",
  clean: true,
  banner: { js: "#!/usr/bin/env node" },
})
