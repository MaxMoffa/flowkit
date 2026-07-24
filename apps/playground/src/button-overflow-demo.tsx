import { parseFlow, type Flow } from "@flowkit-io/core"

/**
 * Demo per il fix dell'overflow del testo dei pulsanti footer (v2.25): review.submitLabel
 * e confirmation.primaryCta/secondaryCta deliberatamente lunghi, per verificare che il
 * testo vada a capo/si adatti invece di sforare la larghezza dello schermo su viewport stretti.
 */
export const buttonOverflowDemoFlow: Flow = parseFlow({
  id: "button-overflow-demo",
  title: "Overflow pulsanti",
  steps: [
    { id: "welcome", type: "intro", title: "Overflow pulsanti", cta: "Inizia" },
    { id: "note", type: "notes", title: "Una nota qualsiasi", required: false },
    {
      id: "review",
      type: "review",
      title: "Rivedi",
      submitLabel: "Invia questa segnalazione dettagliata con tutte le informazioni raccolte ✓",
    },
    {
      id: "end",
      type: "confirmation",
      title: "Grazie!",
      primaryCta: "Torna alla schermata principale della home",
      secondaryCta: "Inizia una nuova segnalazione da capo",
    },
  ],
})
