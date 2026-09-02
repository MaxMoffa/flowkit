import { parseFlow, type Flow } from "@flowkit-io/core"

/**
 * Demo for flow.disableBack: forward-only navigation. Used to exercise that the
 * "Indietro" button (header + footer) is hidden, that review-row shortcuts don't
 * navigate back to earlier steps, and that the browser's own back button doesn't
 * leave the current step.
 *
 * The confirmation step also turns off both footer buttons (`showHomeButton` and
 * `showRestartButton`), so a forward-only flow ends with no footer at all.
 */
export const disableBackDemoFlow: Flow = parseFlow({
  id: "disable-back-demo",
  title: "Solo avanti",
  disableBack: true,
  steps: [
    { id: "welcome", type: "intro", title: "Solo avanti", cta: "Prova" },
    { id: "q1", type: "text", title: "Prima domanda" },
    { id: "q2", type: "text", title: "Seconda domanda" },
    { id: "final-review", type: "review", title: "Rivedi le risposte" },
    {
      id: "end",
      type: "confirmation",
      title: "Grazie!",
      showHomeButton: false,
      showRestartButton: false,
    },
  ],
})
