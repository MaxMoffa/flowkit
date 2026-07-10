import { describe, expect, it } from "vitest"
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { copyTemplate } from "./copy-template"

describe("copyTemplate", () => {
  it("copies files recursively, excluding node_modules/dist", () => {
    const src = mkdtempSync(path.join(tmpdir(), "flowkit-template-src-"))
    const dest = path.join(mkdtempSync(path.join(tmpdir(), "flowkit-template-dest-")), "app")
    try {
      mkdirSync(path.join(src, "src"), { recursive: true })
      mkdirSync(path.join(src, "node_modules", "leftover"), { recursive: true })
      writeFileSync(path.join(src, "package.json"), '{"name":"template"}')
      writeFileSync(path.join(src, "src", "App.tsx"), "export const App = () => null")
      writeFileSync(path.join(src, "node_modules", "leftover", "index.js"), "")

      copyTemplate(src, dest)

      expect(existsSync(path.join(dest, "package.json"))).toBe(true)
      expect(existsSync(path.join(dest, "src", "App.tsx"))).toBe(true)
      expect(existsSync(path.join(dest, "node_modules"))).toBe(false)
    } finally {
      rmSync(src, { recursive: true, force: true })
      rmSync(path.dirname(dest), { recursive: true, force: true })
    }
  })
})
