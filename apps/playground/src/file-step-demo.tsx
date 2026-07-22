import { parseFlow, type Flow } from "@flowkit-io/core"

/** Minimal demo flow exercising the generic "file" step (formats preset + custom accept). */
export const fileStepDemoFlow: Flow = parseFlow({
  id: "file-step-demo",
  title: "Step file",
  steps: [
    { id: "welcome", type: "intro", title: "Allega un file", cta: "Prova" },
    {
      id: "attachment",
      type: "file",
      title: "Carica un documento",
      subtitle: "PDF o documenti di testo, anche più di uno.",
      required: false,
      formatPreset: "documents",
      customAccept: ".pdf",
      multiple: true,
    },
    { id: "end", type: "confirmation", title: "Grazie!", showHomeButton: false },
  ],
})
