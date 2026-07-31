import { odoriFlow, feedbackFlow, restaurantFlow, anagraficaFlow } from "@flowkit-io/presets"
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
import { disableBackDemoFlow } from "./disable-back-demo"
import { flowMarkdownDemoFlow } from "./flow-markdown-demo"
import { smartFillDemoFlow } from "./smart-fill-demo"
import { remoteDataSourceDemoFlow } from "./remote-data-source-demo"
import { bookingSlotDemoFlow } from "./booking-slot-demo"
import { branchDemoFlow } from "./branch-demo"

export const presets: Record<string, Flow> = {
  odori: odoriFlow,
  feedback: feedbackFlow,
  restaurant: restaurantFlow,
  anagrafica: anagraficaFlow,
  "custom-step": customStepDemoFlow,
  "features-demo": featuresDemoFlow,
  "custom-intro": customIntroDemoFlow,
  "result-actions-demo": resultActionsDemoFlow,
  "file-step-demo": fileStepDemoFlow,
  "button-overflow-demo": buttonOverflowDemoFlow,
  "verification-demo": verificationDemoFlow,
  "media-display-demo": mediaDisplayDemoFlow,
  "checkpoint-review-demo": checkpointReviewDemoFlow,
  "disable-back-demo": disableBackDemoFlow,
  "flow-markdown-demo": flowMarkdownDemoFlow,
  "smart-fill-demo": smartFillDemoFlow,
  "remote-data-source-demo": remoteDataSourceDemoFlow,
  "booking-slot-demo": bookingSlotDemoFlow,
  "branch-demo": branchDemoFlow,
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
}
