import { odoriFlow, feedbackFlow, restaurantFlow } from "@flowkit-io/presets"
import type { Flow } from "@flowkit-io/core"
import { customStepDemoFlow } from "./custom-step-demo"
import { featuresDemoFlow } from "./features-demo"
import { customIntroDemoFlow } from "./custom-intro-demo"
import { resultActionsDemoFlow } from "./result-actions-demo"
import { fileStepDemoFlow } from "./file-step-demo"

export const presets: Record<string, Flow> = {
  odori: odoriFlow,
  feedback: feedbackFlow,
  restaurant: restaurantFlow,
  "custom-step": customStepDemoFlow,
  "features-demo": featuresDemoFlow,
  "custom-intro": customIntroDemoFlow,
  "result-actions-demo": resultActionsDemoFlow,
  "file-step-demo": fileStepDemoFlow,
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
}
