import { existsSync } from "node:fs"
import path from "node:path"

export type PackageManager = "pnpm" | "yarn" | "npm"

export function detectPackageManager(cwd: string = process.cwd()): PackageManager {
  if (existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm"
  if (existsSync(path.join(cwd, "yarn.lock"))) return "yarn"
  return "npm"
}

export function installCommand(pm: PackageManager, packages: string[]): string {
  switch (pm) {
    case "pnpm":
      return `pnpm add ${packages.join(" ")}`
    case "yarn":
      return `yarn add ${packages.join(" ")}`
    default:
      return `npm install ${packages.join(" ")}`
  }
}

export function devInstallCommand(pm: PackageManager): string {
  switch (pm) {
    case "pnpm":
      return "pnpm install"
    case "yarn":
      return "yarn install"
    default:
      return "npm install"
  }
}

export function runScriptCommand(pm: PackageManager, script: string): string {
  return pm === "npm" ? `npm run ${script}` : `${pm} ${script}`
}
