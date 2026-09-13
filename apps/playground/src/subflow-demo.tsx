import { parseFlow, type Flow } from "@flowkit-io/core"

/**
 * Demo for the "subflow" step (v2.4x): entering it feels exactly like being in a
 * regular flow — same header/back/footer chrome, one step at a time — except the
 * progress counter goes local (e.g. "1/5" of just this span) instead of the whole
 * flow's. Its children's answers merge flat into the same single `answers` object as
 * every other step (not nested under the subflow's own id, unlike `group`); the nested
 * "branch" child is jumped past exactly like a real top-level flow's branch would.
 */
export const subflowDemoFlow: Flow = parseFlow({
  id: "subflow-demo",
  title: "Flow dentro un flow",
  steps: [
    { id: "welcome", type: "intro", title: "Flow dentro un flow", cta: "Prova" },
    {
      id: "profile",
      type: "subflow",
      title: "Completa il tuo profilo",
      steps: [
        { id: "first-name", type: "text", title: "Nome" },
        { id: "last-name", type: "text", title: "Cognome" },
        {
          id: "has-company",
          type: "radio",
          key: "has_company",
          title: "Hai un'azienda?",
          options: [
            { value: "yes", label: "Sì" },
            { value: "no", label: "No" },
          ],
        },
        {
          id: "skip-company-name",
          type: "branch",
          rules: [{ when: { key: "has_company", op: "eq", value: "no" }, goTo: "bio" }],
        },
        { id: "company-name", type: "text", title: "Nome azienda" },
        { id: "bio", type: "notes", title: "Due righe su di te", required: false },
      ],
    },
    { id: "review", type: "review", title: "Rivedi le risposte" },
    { id: "end", type: "confirmation", title: "Grazie!", showHomeButton: false },
  ],
})
