import { parseFlow, type Flow } from "@flowkit/core"

/** Preset per raccogliere segnalazioni di odori molesti in un'area. */
export const odoriFlow: Flow = parseFlow({
  id: "odori",
  title: "Segnala un odore",
  steps: [
    {
      id: "intro",
      type: "intro",
      title: "Segnala un odore",
      subtitle: "Ci vogliono meno di 2 minuti.",
      emoji: "👃",
      cta: "Inizia",
    },
    {
      id: "location",
      type: "location",
      title: "Dove hai sentito l'odore?",
      placeholder: "Indirizzo o zona",
    },
    {
      id: "smell-type",
      type: "select-cards",
      title: "Che tipo di odore era?",
      multiple: false,
      options: [
        { value: "smoke", label: "Bruciato", emoji: "🔥" },
        { value: "gas", label: "Gas", emoji: "⛽" },
        { value: "sewage", label: "Fogna", emoji: "🚽" },
        { value: "chemical", label: "Chimico", emoji: "🧪" },
        { value: "other", label: "Altro", emoji: "❓" },
      ],
    },
    {
      id: "intensity",
      type: "scale",
      title: "Quanto era intenso?",
      min: 1,
      max: 5,
      minLabel: "Leggero",
      maxLabel: "Molto forte",
    },
    {
      id: "moment",
      type: "chips",
      title: "Quando lo hai notato?",
      multiple: true,
      options: [
        { value: "morning", label: "Mattina" },
        { value: "afternoon", label: "Pomeriggio" },
        { value: "evening", label: "Sera" },
        { value: "night", label: "Notte" },
      ],
    },
    {
      id: "notes",
      type: "notes-photo",
      title: "Vuoi aggiungere dettagli?",
      required: false,
      allowPhoto: true,
      placeholder: "Descrivi cosa hai notato...",
    },
    {
      id: "review",
      type: "review",
      title: "Rivedi la segnalazione",
    },
    {
      id: "confirmation",
      type: "confirmation",
      title: "Grazie per la segnalazione!",
      message: "Il team la esaminerà a breve.",
      emoji: "✅",
    },
  ],
})
