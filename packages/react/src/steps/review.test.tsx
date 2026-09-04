import { describe, expect, it, vi } from "vitest"
import { render, waitFor } from "@testing-library/react"
import { parseFlow, type Answers, type ReviewStep, type Flow } from "@flowkit-io/core"
import "@flowkit-io/core"
import { ReviewStepView } from "./review"

function shopFlow(paymentOverrides: Record<string, unknown> = {}): Flow {
  return parseFlow({
    id: "shop",
    title: "Shop",
    steps: [
      { id: "intro", type: "intro", title: "Start" },
      {
        id: "cart",
        key: "cart",
        type: "catalog",
        title: "Prodotti",
        currency: "eur",
        items: [{ value: "tshirt", label: "T-shirt", price: 2500 }],
      },
      { id: "address", key: "address", type: "address", title: "Indirizzo" },
      {
        id: "pay",
        key: "pay",
        type: "payment-stripe",
        title: "Pay",
        publishableKey: "pk_test_x",
        amountSource: "cart",
        currency: "eur",
        ...paymentOverrides,
      },
      { id: "review", type: "review" },
      { id: "done", type: "confirmation" },
    ],
  })
}

const cartOnly: Answers = {
  cart: { items: [{ value: "tshirt", quantity: 2 }], total: 5000 },
}

const taxResult = { taxAmount: 550, totalWithTax: 5550, currency: "eur", breakdown: [] }

describe("ReviewStepView: tax estimate", () => {
  it("shows no estimate caveat once the flow's own `address` step is answered", async () => {
    const calculateTax = vi.fn().mockResolvedValue(taxResult)
    const flow = shopFlow({ calculateTax })
    const answers: Answers = { ...cartOnly, address: { country: "IT" } }
    const step = flow.steps.find((s) => s.type === "review") as ReviewStep

    const { container } = render(
      <ReviewStepView step={step} value={null} onChange={() => {}} flow={flow} answers={answers} meta={{}} onMetaChange={() => {}} />,
    )

    await waitFor(() => expect(container.querySelector(".fk-order-summary-tax")).not.toBeNull())
    expect(calculateTax).toHaveBeenCalledWith(expect.objectContaining({ addressSource: "collected" }))
    expect(container.querySelector(".fk-order-summary-tax-note")).toBeNull()
  })

  it("labels the tax line as an estimate when it falls back to estimatedAddress (checkpoint review before `address`)", async () => {
    const calculateTax = vi.fn().mockResolvedValue(taxResult)
    const flow = shopFlow({ calculateTax })
    const step = flow.steps.find((s) => s.type === "review") as ReviewStep

    const { container } = render(
      <ReviewStepView
        step={step}
        value={null}
        onChange={() => {}}
        flow={flow}
        answers={cartOnly}
        meta={{}}
        onMetaChange={() => {}}
        estimatedAddress={{ country: "FR" }}
      />,
    )

    await waitFor(() => expect(container.querySelector(".fk-order-summary-tax-note")).not.toBeNull())
    expect(calculateTax).toHaveBeenCalledWith(
      expect.objectContaining({ addressSource: "estimated", address: { country: "FR" } }),
    )
    expect(container.querySelector(".fk-order-summary-tax-note")!.textContent).toContain("stima")
  })
})
