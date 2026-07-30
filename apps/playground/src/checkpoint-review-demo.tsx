import { parseFlow, type Flow } from "@flowkit-io/core"

/**
 * Demo for the hybrid review role: a mid-flow "checkpoint" review (partial
 * recap, doesn't submit) followed by more questions and the usual "final"
 * review right before confirmation. Also used to exercise clickable review
 * rows: click a row on the final review to jump back to q1/q2, edit, and
 * return.
 */
export const checkpointReviewDemoFlow: Flow = parseFlow({
  id: "checkpoint-review-demo",
  title: "Riepilogo con checkpoint",
  steps: [
    { id: "welcome", type: "intro", title: "Riepilogo con checkpoint", cta: "Prova" },
    { id: "q1", type: "text", title: "Prima domanda" },
    { id: "checkpoint-1", type: "review", title: "Controlla finora", mode: "checkpoint" },
    { id: "q2", type: "text", title: "Seconda domanda" },
    { id: "sig", type: "signature", title: "Firma qui" },
    { id: "final-review", type: "review", title: "Rivedi le risposte" },
    { id: "end", type: "confirmation", title: "Grazie!", showHomeButton: false },
  ],
})
