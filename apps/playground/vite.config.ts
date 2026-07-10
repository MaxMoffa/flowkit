import { fileURLToPath } from "node:url"
import { resolve, dirname } from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === "true" ? "/flowkit/" : "/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        fullscreen: resolve(__dirname, "fullscreen.html"),
      },
    },
  },
})
