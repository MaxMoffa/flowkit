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

// I tipi di step registrati da @flowkit-io/core (build già eseguita da `npm run build`).
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

// L'esistenza del file non basta: un componente può esistere senza essere registrato,
// e in quel caso il flow renderizza uno step vuoto a runtime senza che nulla fallisca.
// Qui si verifica la registrazione vera, entry opzionali incluse.
const { getStepComponent } = await import("../packages/react/dist/index.js")
for (const entry of ["map-maplibre", "map-leaflet", "payment-stripe"]) {
  await import(`../packages/react/dist/${entry}.js`)
}

const unregistered = steps.filter((s) => !getStepComponent(s))
if (unregistered.length) {
  console.error("Spec-check FALLITO, step registrati in core ma senza componente React:", unregistered)
  process.exit(1)
}

console.log(`Spec-check OK (${steps.length} step registrati)`)
