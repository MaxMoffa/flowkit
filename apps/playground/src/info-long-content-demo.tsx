import { parseFlow, type Flow } from "@flowkit-io/core"

/**
 * Demo for "info" (repeatable, content-only, same look as intro) and
 * "long-content" (full-width independently-scrollable content, with an
 * opt-in "scroll to the end before continuing" gate).
 */
export const infoLongContentDemoFlow: Flow = parseFlow({
  id: "info-long-content-demo",
  title: "Step informativi",
  steps: [
    { id: "welcome", type: "intro", title: "Step informativi", cta: "Prova" },
    {
      id: "before",
      type: "info",
      title: "Prima di iniziare",
      subtitle: "Questo è uno step **info**: nessun campo, nessun valore raccolto.",
      image: { kind: "emoji", value: "ℹ️" },
    },
    { id: "q1", type: "text", title: "Come ti chiami?" },
    {
      id: "terms",
      type: "long-content",
      title: "Termini e condizioni",
      requireScrollToEnd: true,
      content: Array.from(
        { length: 12 },
        (_, i) =>
          `**Sezione ${i + 1}**\n\nTesto *lungo* di prova per la sezione ${i + 1}, con un [link](https://example.com) e:\n\n- punto uno\n- punto due\n- punto tre`,
      ).join("\n\n"),
    },
    {
      id: "after",
      type: "info",
      title: "Fatto!",
      subtitle: "Un secondo step info, ripetuto più avanti nel flow.",
    },
    { id: "end", type: "confirmation", title: "Grazie!", showHomeButton: false },
  ],
})
