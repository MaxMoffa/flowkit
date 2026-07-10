import { cpSync, mkdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

/** Radice dei template, risolta relativamente al file bundle corrente (dist/<bin>.js -> ../templates). */
export function templatesRoot(importMetaUrl: string): string {
  const here = path.dirname(fileURLToPath(importMetaUrl))
  return path.resolve(here, "../templates")
}

/** Copia ricorsiva di un template su una cartella di destinazione, escludendo node_modules/dist. */
export function copyTemplate(srcDir: string, destDir: string): void {
  mkdirSync(destDir, { recursive: true })
  cpSync(srcDir, destDir, {
    recursive: true,
    filter: (source) => !/[/\\](node_modules|dist)([/\\]|$)/.test(source),
  })
}
