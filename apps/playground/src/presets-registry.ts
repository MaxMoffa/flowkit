import { odoriFlow, feedbackFlow } from "@flowkit/presets"
import type { Flow } from "@flowkit/core"
import { customStepDemoFlow } from "./custom-step-demo"
import { featuresDemoFlow } from "./features-demo"
import { customIntroDemoFlow } from "./custom-intro-demo"

export const presets: Record<string, Flow> = {
  odori: odoriFlow,
  feedback: feedbackFlow,
  "custom-step": customStepDemoFlow,
  "features-demo": featuresDemoFlow,
  "custom-intro": customIntroDemoFlow,
}

export const presetLabels: Record<string, string> = {
  odori: "Segnala odore",
  feedback: "Feedback",
  "custom-step": "Step custom (demo)",
  "features-demo": "OAuth + Mappa (demo)",
  "custom-intro": "Intro & conferma custom (demo)",
}
