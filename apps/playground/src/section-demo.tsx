import { parseFlow, type Flow } from "@flowkit-io/core"

/**
 * Demo for the "section" primitive (v2.4x): steps stay fully separate pages (own
 * navigation/validation, unchanged) but share a persistent header banner + a
 * segmented progress bar per section — unlike `group`, which fuses steps into one page.
 */
export const sectionDemoFlow: Flow = parseFlow({
  id: "section-demo",
  title: "Sezioni visive",
  sections: [
    { id: "personal", title: "Dati personali", color: "#2783DE", icon: { kind: "emoji", value: "👤" } },
    { id: "prefs", title: "Preferenze", color: "#46A171", icon: { kind: "emoji", value: "⚙️" } },
  ],
  steps: [
    { id: "welcome", type: "intro", title: "Sezioni visive", cta: "Prova" },
    { id: "name", type: "text", title: "Nome", sectionId: "personal" },
    { id: "surname", type: "text", title: "Cognome", sectionId: "personal" },
    { id: "email", type: "text", title: "Email", variant: "email", sectionId: "personal" },
    { id: "channel", type: "radio", title: "Canale preferito", sectionId: "prefs", options: [
      { value: "email", label: "Email" },
      { value: "sms", label: "SMS" },
    ] },
    { id: "notes", type: "notes", title: "Note", required: false },
    { id: "review", type: "review", title: "Rivedi le risposte" },
    { id: "end", type: "confirmation", title: "Grazie!", showHomeButton: false },
  ],
})
