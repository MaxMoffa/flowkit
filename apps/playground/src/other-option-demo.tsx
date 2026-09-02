import { parseFlow, type Flow } from "@flowkit-io/core"

/**
 * Demo for the opt-in "Altro" choice on `radio` / `multi-select` steps: the author adds
 * `otherOption` to the step and the runner appends an "Altro" row with a free-text input.
 * What the user types is stored as the answer value (a string not matching any option).
 */
export const otherOptionDemoFlow: Flow = parseFlow({
  id: "other-option-demo",
  title: "Opzione «Altro»",
  steps: [
    { id: "welcome", type: "intro", title: "Opzione «Altro»", cta: "Prova" },
    {
      id: "channel",
      type: "radio",
      key: "channel",
      title: "Come ci hai trovato?",
      subtitle: "Selezione singola, con «Altro» a testo libero.",
      options: [
        { value: "search", label: "Motore di ricerca" },
        { value: "friend", label: "Passaparola" },
        { value: "social", label: "Social" },
      ],
      otherOption: { placeholder: "Dove, di preciso?" },
    },
    {
      id: "topics",
      type: "multi-select",
      key: "topics",
      title: "Su cosa vuoi ricevere aggiornamenti?",
      subtitle: "Selezione multipla, con «Altro».",
      required: false,
      min: 0,
      options: [
        { value: "product", label: "Prodotto" },
        { value: "pricing", label: "Prezzi" },
        { value: "events", label: "Eventi" },
      ],
      otherOption: { label: "Altro argomento" },
    },
    { id: "review", type: "review", title: "Rivedi", submitLabel: "Invia" },
    { id: "end", type: "confirmation", title: "Grazie!", showHomeButton: false },
  ],
})
