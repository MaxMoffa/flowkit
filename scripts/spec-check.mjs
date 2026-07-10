import { existsSync } from "node:fs"

const required = [
  "packages/core", "packages/react", "packages/themes",
  "packages/adapters", "packages/presets", "apps/playground",
  "packages/presets/src/odori.ts", "packages/presets/src/feedback.ts",
  "packages/themes/src/notion-clean.ts",
]

const missing = required.filter((p) => !existsSync(p))
if (missing.length) {
  console.error("Spec-check FALLITO, mancano:", missing)
  process.exit(1)
}

// Pacchetti renderer presenti nel workspace, con l'estensione di file step attesa.
const frameworkPackages = [
  { dir: "packages/react/src/steps", ext: "tsx" },
  { dir: "packages/vue/src/steps", ext: "vue" },
  { dir: "packages/svelte/src/steps", ext: "svelte" },
  { dir: "packages/vanilla/src/steps", ext: "ts" },
].filter((fw) => existsSync(fw.dir))

// I tipi di step registrati da @flowkit/core (build già eseguita da `pnpm build`).
const { listRegisteredStepTypes } = await import("../packages/core/dist/index.js")
const steps = listRegisteredStepTypes()

for (const fw of frameworkPackages) {
  for (const s of steps) {
    const f = `${fw.dir}/${s}.${fw.ext}`
    if (!existsSync(f)) {
      console.error("Spec-check FALLITO, manca lo step:", f)
      process.exit(1)
    }
  }
}
console.log("Spec-check OK")
