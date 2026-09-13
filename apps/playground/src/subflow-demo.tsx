import { parseFlow, type Flow } from "@flowkit-io/core"

/**
 * Demo for the "subflow" step (v2.4x): a step that behaves as a fully self-contained
 * mini flow — its children render one at a time, with their own internal next/prev
 * navigation and progress. Unlike `group` (which fuses every child onto one page), only
 * the current child is on screen; a nested "branch" child (invisible routing hop) is
 * jumped past exactly like a real top-level flow would.
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
