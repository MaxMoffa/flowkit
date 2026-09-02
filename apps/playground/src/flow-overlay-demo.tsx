import { parseFlow, type Flow } from "@flowkit-io/core"

/**
 * Demo for `<FlowOverlay>` (`@flowkit-io/react/overlay`): the same flow shown as a
 * bottom drawer or a centered dialog instead of inline. The playground special-cases
 * this preset key in `app.tsx` — it renders an "Apri flow" button + a presentation
 * toggle instead of the usual inline `<FlowRunner>`.
 */
export const flowOverlayDemoFlow: Flow = parseFlow({
  id: "flow-overlay-demo",
  title: "Flow in overlay",
  steps: [
    { id: "welcome", type: "intro", title: "Un attimo del tuo tempo", cta: "Inizia" },
    {
      id: "channel",
      type: "radio",
      key: "channel",
      title: "Come ci hai trovato?",
      options: [
        { value: "search", label: "Ricerca" },
        { value: "friend", label: "Passaparola" },
        { value: "social", label: "Social" },
      ],
    },
    { id: "review", type: "review", title: "Rivedi", submitLabel: "Invia" },
    { id: "end", type: "confirmation", title: "Grazie!", showHomeButton: false },
  ],
})
