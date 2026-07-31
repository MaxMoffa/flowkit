import { parseFlow, type Flow } from "@flowkit-io/core"

/**
 * Demo for the invisible "branch" step (v2.34): answering "No" skips the
 * "pet-name" question entirely, jumping straight to the review — the branch
 * step itself is never shown, and Back from the review follows the path
 * actually taken (returns to "has-pet", not "pet-name").
 */
export const branchDemoFlow: Flow = parseFlow({
  id: "branch-demo",
  title: "Ramificazione condizionale",
  steps: [
    { id: "welcome", type: "intro", title: "Ramificazione condizionale", cta: "Prova" },
    {
      id: "has-pet",
      type: "radio",
      key: "has_pet",
      title: "Hai un animale domestico?",
      options: [
        { value: "yes", label: "Sì" },
        { value: "no", label: "No" },
      ],
    },
    {
      id: "router",
      type: "branch",
      rules: [{ when: { key: "has_pet", op: "eq", value: "no" }, goTo: "review" }],
    },
    { id: "pet-name", type: "text", title: "Come si chiama?" },
    { id: "review", type: "review", title: "Rivedi le risposte" },
    { id: "end", type: "confirmation", title: "Grazie!", showHomeButton: false },
  ],
})
