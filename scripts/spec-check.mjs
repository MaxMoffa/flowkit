import { existsSync } from "node:fs"

const required = [
  "packages/core", "packages/react", "packages/themes",
  "packages/adapters", "packages/presets", "apps/playground",
  "packages/presets/src/odori.ts", "packages/presets/src/feedback.ts",
  "packages/themes/src/notion-clean.ts",
]
const steps = [
  "intro", "location", "select-cards", "scale", "chips", "faces",
  "notes-photo", "nps", "multi-select", "text", "review", "confirmation",
]

const missing = required.filter((p) => !existsSync(p))
if (missing.length) {
  console.error("Spec-check FALLITO, mancano:", missing)
  process.exit(1)
}
// I componenti degli step devono esistere nel pacchetto react
for (const s of steps) {
  const f = `packages/react/src/steps/${s}.tsx`
  if (!existsSync(f)) {
    console.error("Spec-check FALLITO, manca lo step:", f)
    process.exit(1)
  }
}
console.log("Spec-check OK")
