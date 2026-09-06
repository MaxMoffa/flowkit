import { parseFlow, type Flow } from "@flowkit-io/core"

/**
 * Demo flow for the two camera-related step types: `photo` (live `getUserMedia`
 * viewfinder + shutter, falling back to `<input capture>` when the camera is denied/
 * unavailable, never a gallery) and `barcode-scan` (live decode, native
 * `BarcodeDetector` or a ZXing fallback, always with a manual-entry escape hatch —
 * see DECISIONS.md for the architecture).
 */
export const cameraDemoFlow: Flow = parseFlow({
  id: "camera-demo",
  title: "Fotocamera",
  steps: [
    { id: "welcome", type: "intro", title: "Scatta e scansiona", cta: "Inizia" },
    {
      id: "receipt",
      key: "receipt",
      type: "photo",
      title: "Fotografa lo scontrino",
      subtitle: "Solo fotocamera, niente galleria. Fino a 2 foto.",
      maxPhotos: 2,
      required: false,
    },
    {
      id: "sku",
      key: "sku",
      type: "barcode-scan",
      title: "Scansiona il codice del prodotto",
      subtitle: "Inquadra il codice a barre o il QR code, oppure inseriscilo manualmente.",
      required: false,
    },
    { id: "review", type: "review", title: "Controlla" },
    { id: "done", type: "confirmation", title: "Fatto!" },
  ],
})
