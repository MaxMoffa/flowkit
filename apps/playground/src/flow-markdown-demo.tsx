import { parseFlow, type Flow } from "@flowkit-io/core"

/** Demo exercising the restricted markdown renderer (bold/italic/links/lists) across
 *  block and inline contexts, including a malicious link that must render inert. */
export const flowMarkdownDemoFlow: Flow = parseFlow({
  id: "flow-markdown-demo",
  title: "Markdown nei testi del flow",
  steps: [
    {
      id: "welcome",
      type: "intro",
      title: "**Benvenuto** nel test *markdown*",
      subtitle:
        "Supporta [un link](https://example.com) e liste:\n- primo punto\n- secondo punto",
      cta: "Inizia",
    },
    {
      id: "consent",
      type: "checkbox",
      title: "Titolo con *enfasi*",
      label: "- voce finta uno\n- voce finta due (deve restare testo, non lista)",
      description:
        "Malevolo: [clicca qui](javascript:alert('xss')) · sicuro: [informativa](https://example.com/privacy)",
      required: false,
    },
    {
      id: "end",
      type: "confirmation",
      title: "Grazie!",
      message: "Riepilogo:\n- punto **in grassetto**\n- punto *in corsivo*",
      showHomeButton: false,
    },
  ],
})
