import type { Flow } from "@flowkit-io/core"

/** Every demo flow used to be a static top-level import here, bundling all ~21 of them
 *  (some carry inline base64 media) into one eager chunk regardless of which preset the
 *  visitor actually opens. Lazy per-key instead: `loadPreset` dynamically imports (and
 *  caches) only the one selected. */
const presetLoaders: Record<string, () => Promise<Flow>> = {
  odori: () => import("@flowkit-io/presets").then((m) => m.odoriFlow),
  feedback: () => import("@flowkit-io/presets").then((m) => m.feedbackFlow),
  restaurant: () => import("@flowkit-io/presets").then((m) => m.restaurantFlow),
  anagrafica: () => import("@flowkit-io/presets").then((m) => m.anagraficaFlow),
  "custom-step": () => import("./custom-step-demo").then((m) => m.customStepDemoFlow),
  "features-demo": () => import("./features-demo").then((m) => m.featuresDemoFlow),
  "custom-intro": () => import("./custom-intro-demo").then((m) => m.customIntroDemoFlow),
  "result-actions-demo": () => import("./result-actions-demo").then((m) => m.resultActionsDemoFlow),
  "file-step-demo": () => import("./file-step-demo").then((m) => m.fileStepDemoFlow),
  "button-overflow-demo": () => import("./button-overflow-demo").then((m) => m.buttonOverflowDemoFlow),
  "verification-demo": () => import("./verification-demo").then((m) => m.verificationDemoFlow),
  "media-display-demo": () => import("./media-display-demo").then((m) => m.mediaDisplayDemoFlow),
  "checkpoint-review-demo": () => import("./checkpoint-review-demo").then((m) => m.checkpointReviewDemoFlow),
  "disable-back-demo": () => import("./disable-back-demo").then((m) => m.disableBackDemoFlow),
  "flow-markdown-demo": () => import("./flow-markdown-demo").then((m) => m.flowMarkdownDemoFlow),
  "smart-fill-demo": () => import("./smart-fill-demo").then((m) => m.smartFillDemoFlow),
  "remote-data-source-demo": () => import("./remote-data-source-demo").then((m) => m.remoteDataSourceDemoFlow),
  "booking-slot-demo": () => import("./booking-slot-demo").then((m) => m.bookingSlotDemoFlow),
  "branch-demo": () => import("./branch-demo").then((m) => m.branchDemoFlow),
  "info-long-content-demo": () => import("./info-long-content-demo").then((m) => m.infoLongContentDemoFlow),
  "i18n-texts-demo": () => import("./i18n-texts-demo").then((m) => m.i18nTextsDemoFlow),
  "step-image-demo": () => import("./step-image-demo").then((m) => m.stepImageDemoFlow),
}

export const presetKeys: string[] = Object.keys(presetLoaders)

const cache = new Map<string, Promise<Flow>>()

/** Loads (and memoizes) the flow for `key`. Throws synchronously for an unknown key —
 *  same failure mode the old `presets[key]!` non-null assertion had. */
export function loadPreset(key: string): Promise<Flow> {
  const loader = presetLoaders[key]
  if (!loader) throw new Error(`Unknown preset "${key}"`)
  let promise = cache.get(key)
  if (!promise) {
    promise = loader()
    cache.set(key, promise)
  }
  return promise
}

export const presetLabels: Record<string, string> = {
  odori: "Segnala odore",
  feedback: "Feedback",
  restaurant: "Prenotazione ristorante",
  anagrafica: "Dati anagrafici",
  "custom-step": "Step custom (demo)",
  "features-demo": "OAuth + Mappa (demo)",
  "custom-intro": "Intro & conferma custom (demo)",
  "result-actions-demo": "Azioni sul risultato (demo)",
  "file-step-demo": "Step file (demo)",
  "button-overflow-demo": "Pulsanti lunghi (demo)",
  "verification-demo": "Step di verifica (demo)",
  "media-display-demo": "Media di sola visualizzazione (demo)",
  "checkpoint-review-demo": "Riepilogo con checkpoint (demo)",
  "disable-back-demo": "Navigazione solo avanti (demo)",
  "flow-markdown-demo": "Markdown nei testi (demo)",
  "smart-fill-demo": "Codice fiscale suggerito (demo)",
  "remote-data-source-demo": "Dati remoti / autocomplete (demo)",
  "booking-slot-demo": "Prenotazione slot (demo)",
  "branch-demo": "Ramificazione condizionale (demo)",
  "info-long-content-demo": "Step informativi (demo)",
  "i18n-texts-demo": "Testi personalizzati (demo)",
  "step-image-demo": "Campo immagine (demo)",
}
