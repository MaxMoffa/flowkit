import { parseFlow, type Flow } from "@flowkit-io/core"

/**
 * Minimal repro for the footer layout bug (desktop, cart + `ctaFootnote` together).
 * The `review` step deliberately never shows the running total (it has its own
 * itemized recap — see flow-runner.tsx's `orderSummary`), so the only place the two
 * genuinely coexist is `intro` with a resumed cart (e.g. an abandoned checkout) —
 * the e2e spec seeds that via the fullscreen preview's `?initialAnswers=`. `review`
 * still carries its own `ctaFootnote` here too, for manual testing/parity with the
 * original bug report.
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
