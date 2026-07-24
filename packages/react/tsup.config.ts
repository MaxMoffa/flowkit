import { defineConfig } from "tsup"

/** Step types with an opt-in entry, mirroring src/steps/entries/. */
const stepEntries = [
  "intro",
  "select-cards",
  "scale",
  "chips",
  "faces",
  "notes",
  "media",
  "file",
  "date-time",
  "nps",
  "multi-select",
  "radio",
  "text",
  "review",
  "confirmation",
  "oauth",
  "group",
  "signature",
]

export default defineConfig({
  entry: {
    index: "src/index.tsx",
    lean: "src/lean.tsx",
    "map-maplibre": "src/map-maplibre.ts",
    "map-leaflet": "src/map-leaflet.ts",
    "payment-stripe": "src/payment-stripe.ts",
    ...Object.fromEntries(stepEntries.map((type) => [`steps/${type}`, `src/steps/entries/${type}.ts`])),
  },
  format: ["esm"],
  dts: true,
  clean: true,
  external: ["react", "react-dom"],
})
