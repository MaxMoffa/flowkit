import { odoriFlow, feedbackFlow, restaurantFlow } from "@flowkit-io/presets"
import type { Flow } from "@flowkit-io/core"
import { customStepDemoFlow } from "./custom-step-demo"
import { featuresDemoFlow } from "./features-demo"
import { customIntroDemoFlow } from "./custom-intro-demo"
import { resultActionsDemoFlow } from "./result-actions-demo"
import { fileStepDemoFlow } from "./file-step-demo"
import { buttonOverflowDemoFlow } from "./button-overflow-demo"
import { verificationDemoFlow } from "./verification-demo"
import { mediaDisplayDemoFlow } from "./media-display-demo"
import { checkpointReviewDemoFlow } from "./checkpoint-review-demo"

export const presets: Record<string, Flow> = {
  odori: odoriFlow,
  feedback: feedbackFlow,
  restaurant: restaurantFlow,
  "custom-step": customStepDemoFlow,
  "features-demo": featuresDemoFlow,
  "custom-intro": customIntroDemoFlow,
  "result-actions-demo": resultActionsDemoFlow,
  "file-step-demo": fileStepDemoFlow,
  "button-overflow-demo": buttonOverflowDemoFlow,
  "verification-demo": verificationDemoFlow,
  "media-display-demo": mediaDisplayDemoFlow,
  "checkpoint-review-demo": checkpointReviewDemoFlow,
}

export const presetLabels: Record<string, string> = {
  odori: "Segnala odore",
  feedback: "Feedback",
  restaurant: "Prenotazione ristorante",
  "custom-step": "Step custom (demo)",
  "features-demo": "OAuth + Mappa (demo)",
  "custom-intro": "Intro & conferma custom (demo)",
  "result-actions-demo": "Azioni sul risultato (demo)",
  "file-step-demo": "Step file (demo)",
  "button-overflow-demo": "Pulsanti lunghi (demo)",
  "verification-demo": "Step di verifica (demo)",
  "media-display-demo": "Media di sola visualizzazione (demo)",
  "checkpoint-review-demo": "Riepilogo con checkpoint (demo)",
}
