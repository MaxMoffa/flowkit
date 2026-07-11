import { describe, expect, it } from "vitest"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { detectPackageManager, installCommand, runScriptCommand } from "./detect-package-manager"

function withTmpDir(fn: (dir: string) => void) {
  const dir = mkdtempSync(path.join(tmpdir(), "flowkit-cli-test-"))
  try {
    fn(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe("detectPackageManager", () => {
  it("detects pnpm from pnpm-lock.yaml", () => {
    withTmpDir((dir) => {
      writeFileSync(path.join(dir, "pnpm-lock.yaml"), "")
      expect(detectPackageManager(dir)).toBe("pnpm")
    })
  })

  it("detects yarn from yarn.lock", () => {
    withTmpDir((dir) => {
      writeFileSync(path.join(dir, "yarn.lock"), "")
      expect(detectPackageManager(dir)).toBe("yarn")
    })
  })

  it("defaults to npm when no lockfile is present", () => {
    withTmpDir((dir) => {
      expect(detectPackageManager(dir)).toBe("npm")
    })
  })
})

describe("installCommand / runScriptCommand", () => {
  it("builds the right install command per package manager", () => {
    expect(installCommand("pnpm", ["@flowkit-io/core"])).toBe("pnpm add @flowkit-io/core")
    expect(installCommand("yarn", ["@flowkit-io/core"])).toBe("yarn add @flowkit-io/core")
    expect(installCommand("npm", ["@flowkit-io/core"])).toBe("npm install @flowkit-io/core")
  })

  it("builds the right run-script command per package manager", () => {
    expect(runScriptCommand("pnpm", "dev")).toBe("pnpm dev")
    expect(runScriptCommand("npm", "dev")).toBe("npm run dev")
  })
})
