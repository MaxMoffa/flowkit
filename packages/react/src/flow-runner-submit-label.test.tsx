import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { formatMoney, parseFlow } from "@flowkit-io/core"

/** `formatMoney`'s it-IT output uses a non-breaking space (U+00A0) before the currency
 *  symbol (`Intl.NumberFormat`'s own choice) — build expected labels through it instead
 *  of a hand-typed literal, so a plain space here can't silently mismatch. */
function paidLabel(minorUnits: number): string {
  return `Paga ${formatMoney(minorUnits, "eur", "it")} ✓`
}
import { FlowRunner } from "./flow-runner"
import "./steps/builtins"

/** The review step's primary button doubles as the flow's submit action (see
 *  flow-runner.tsx's `primaryLabel`) — when the flow charges a payment, the button
 *  should name the actual amount ("Paga 12,00 € ✓") instead of the generic "Invia
 *  segnalazione ✓"/"Completa pagamento e invia ✓" text, so the visitor knows what
 *  they're about to pay before tapping it. */
describe("FlowRunner: review submit label", () => {
  it("stays the plain submit label when the flow has no payment step", () => {
    const flow = parseFlow({
      id: "f",
      title: "F",
      steps: [
        { id: "welcome", type: "intro", cta: "Inizia" },
        { id: "review", type: "review" },
        { id: "end", type: "confirmation" },
      ],
    })
    render(<FlowRunner flow={flow} initialStep="review" />)
    expect(screen.getByRole("button", { name: "Invia segnalazione ✓" })).not.toBeNull()
  })

  it('names the amount ("Paga <amount> ✓") for a fixed-amount payment step', () => {
    const flow = parseFlow({
      id: "f",
      title: "F",
      steps: [
        { id: "welcome", type: "intro", cta: "Inizia" },
        {
          id: "pay",
          key: "pay",
          type: "payment-stripe",
          title: "Paga",
          publishableKey: "pk_test_x",
          amount: 1200,
          currency: "eur",
          previewSelected: true,
        },
        { id: "review", type: "review" },
        { id: "end", type: "confirmation" },
      ],
    })
    render(<FlowRunner flow={flow} initialStep="review" />)
    expect(screen.getByRole("button", { name: paidLabel(1200) })).not.toBeNull()
  })

  it("names the live cart total for amountSource: \"cart\"", () => {
    const flow = parseFlow({
      id: "f",
      title: "F",
      steps: [
        { id: "welcome", type: "intro", cta: "Inizia" },
        {
          id: "shop",
          key: "shop",
          type: "catalog",
          title: "Shop",
          currency: "eur",
          items: [{ value: "a", label: "A", price: 500 }],
        },
        {
          id: "pay",
          key: "pay",
          type: "payment-stripe",
          title: "Paga",
          publishableKey: "pk_test_x",
          amountSource: "cart",
          currency: "eur",
          previewSelected: true,
        },
        { id: "review", type: "review" },
        { id: "end", type: "confirmation" },
      ],
    })
    render(
      <FlowRunner flow={flow} initialStep="review" initialAnswers={{ shop: { items: [{ value: "a", quantity: 2 }], total: 1000 } }} />,
    )
    expect(screen.getByRole("button", { name: paidLabel(1000) })).not.toBeNull()
  })

  it("falls back to the plain payment label (no amount) when amountSource: \"cart\" resolves to 0", () => {
    const flow = parseFlow({
      id: "f",
      title: "F",
      steps: [
        { id: "welcome", type: "intro", cta: "Inizia" },
        {
          id: "pay",
          key: "pay",
          type: "payment-stripe",
          title: "Paga",
          publishableKey: "pk_test_x",
          amountSource: "cart",
          currency: "eur",
          previewSelected: true,
        },
        { id: "review", type: "review" },
        { id: "end", type: "confirmation" },
      ],
    })
    render(<FlowRunner flow={flow} initialStep="review" />)
    expect(screen.getByRole("button", { name: "Completa pagamento e invia ✓" })).not.toBeNull()
  })

  it("an explicit step.submitLabel always wins, payment or not", () => {
    const flow = parseFlow({
      id: "f",
      title: "F",
      steps: [
        { id: "welcome", type: "intro", cta: "Inizia" },
        {
          id: "pay",
          key: "pay",
          type: "payment-stripe",
          title: "Paga",
          publishableKey: "pk_test_x",
          amount: 1200,
          currency: "eur",
          previewSelected: true,
        },
        { id: "review", type: "review", submitLabel: "Conferma ordine" },
        { id: "end", type: "confirmation" },
      ],
    })
    render(<FlowRunner flow={flow} initialStep="review" />)
    expect(screen.getByRole("button", { name: "Conferma ordine" })).not.toBeNull()
  })
})
