import { test, expect } from "@playwright/test"
import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const cliDist = path.resolve(here, "../packages/create-flowkit/dist")

test.describe("create-flowkit CLI", () => {
  test("flowkit-init writes the react wiring file non-interactively", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "flowkit-e2e-init-"))
    try {
      execFileSync(
        "node",
        [path.join(cliDist, "flowkit-init.js"), "--framework", "react", "--steps=", "--no-install"],
        { cwd: dir },
      )
      expect(existsSync(path.join(dir, "src", "flowkit-setup.tsx"))).toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test("flowkit-init --steps=map-leaflet imports only the leaflet entry, no maplibre-gl", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "flowkit-e2e-init-steps-"))
    try {
      execFileSync(
        "node",
        [path.join(cliDist, "flowkit-init.js"), "--framework", "react", "--steps=map-leaflet", "--no-install"],
        { cwd: dir },
      )
      const setup = readFileSync(path.join(dir, "src", "flowkit-setup.tsx"), "utf8")
      expect(setup).toContain('import "@flowkit/react/map-leaflet"')
      expect(setup).not.toContain('import "@flowkit/react/map-maplibre"')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test("flowkit-init with no --steps imports neither map entry", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "flowkit-e2e-init-nosteps-"))
    try {
      execFileSync(
        "node",
        [path.join(cliDist, "flowkit-init.js"), "--framework", "react", "--steps=", "--no-install"],
        { cwd: dir },
      )
      const setup = readFileSync(path.join(dir, "src", "flowkit-setup.tsx"), "utf8")
      expect(setup).not.toContain("@flowkit/react/map-")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test("create-flowkit scaffolds a buildable react mini-app", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "flowkit-e2e-create-"))
    try {
      execFileSync(
        "node",
        [
          path.join(cliDist, "create-flowkit.js"),
          "--name",
          "demo-app",
          "--framework",
          "react",
          "--no-install",
        ],
        { cwd: dir },
      )
      const appDir = path.join(dir, "demo-app")
      expect(existsSync(path.join(appDir, "package.json"))).toBe(true)
      expect(existsSync(path.join(appDir, "src", "App.tsx"))).toBe(true)
      expect(existsSync(path.join(appDir, "vite.config.ts"))).toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
