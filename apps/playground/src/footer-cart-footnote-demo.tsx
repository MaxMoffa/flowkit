import { parseFlow, type Flow } from "@flowkit-io/core"

/**
 * Exercises the footer's cart trigger next to a `ctaFootnote` (intro and review both
 * carry one). Neither `intro` nor `review` ever shows the cart (trigger or total) —
 * see flow-runner.tsx's `orderSummary`, gated off on both roles — so the two never
 * actually coexist visually; the e2e spec seeds a resumed cart via the fullscreen
 * preview's `?initialAnswers=` to assert exactly that (no cart, footnote unaffected).
 */
export const footerCartFootnoteDemoFlow: Flow = parseFlow({
  id: "footer-cart-footnote-demo",
  title: "Footer: carrello + footnote",
  steps: [
    {
      id: "welcome",
      type: "intro",
      title: "Footer: carrello + footnote",
      cta: "Prova",
      ctaFootnote: "Continuando riprendi il carrello lasciato in sospeso.",
    },
    {
      id: "cart",
      key: "cart",
      type: "catalog",
      title: "Scegli un prodotto",
      currency: "eur",
      items: [{ value: "sticker", label: "Adesivo", price: 500, image: { kind: "emoji", value: "✨" } }],
    },
    {
      id: "review",
      type: "review",
      title: "Rivedi le risposte",
      ctaFootnote: "Procedendo accetti i [termini di servizio](https://example.com/termini).",
    },
    { id: "end", type: "confirmation", title: "Grazie!", showHomeButton: false },
  ],
})
