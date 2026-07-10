import { cpSync, mkdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

/** Templates root, resolved relative to the current bundle file (dist/<bin>.js -> ../templates). */
export function templatesRoot(importMetaUrl: string): string {
  const here = path.dirname(fileURLToPath(importMetaUrl))
  return path.resolve(here, "../templates")
}

/** Recursively copies a template to a destination folder, excluding node_modules/dist. */
export function copyTemplate(srcDir: string, destDir: string): void {
  mkdirSync(destDir, { recursive: true })
  cpSync(srcDir, destDir, {
    recursive: true,
    filter: (source) => !/[/\\](node_modules|dist)([/\\]|$)/.test(source),
  })
}
