import { parseFlow, type Flow } from "@flowkit-io/core"

/**
 * Demo for `flow.texts` (v2.34): overrides the footer's back label and the
 * confirmation's restart/home button defaults, to exercise that a flow-level
 * text override wins over the library's built-in chrome text.
 */
export const i18nTextsDemoFlow: Flow = parseFlow({
  id: "i18n-texts-demo",
  title: "Testi personalizzati",
  texts: {
    back: "Torna indietro",
    backAriaLabel: "Torna indietro",
    continue: "Vai avanti",
    confirmationRestart: "Ricomincia da capo",
    confirmationHome: "Chiudi",
  },
  steps: [
    { id: "welcome", type: "intro", title: "Testi personalizzati", cta: "Prova" },
    { id: "q1", type: "text", title: "Prima domanda" },
    { id: "end", type: "confirmation", title: "Grazie!" },
  ],
})
