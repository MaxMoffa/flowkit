import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, waitFor } from "@testing-library/react"
import { parseFlow, type AnswerValue, type CatalogStep, type Flow } from "@flowkit-io/core"
import "@flowkit-io/core"
import { CatalogStepView } from "./catalog"

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

function StatefulCatalog({
  flow,
  estimatedAddress,
}: {
  flow: Flow
  estimatedAddress?: { country: string }
}) {
  const [value, setValue] = useState<AnswerValue>(null)
  const step = flow.steps.find((s) => s.type === "catalog") as CatalogStep
  return (
    <CatalogStepView
      step={step}
      value={value}
      onChange={setValue}
      flow={flow}
      answers={value ? { cart: value } : {}}
      meta={{}}
      onMetaChange={() => {}}
      estimatedAddress={estimatedAddress}
    />
  )
}

describe("CatalogStepView: tax estimate", () => {
  it("shows nothing when no calculateTax is wired on the payment step", () => {
    const { container } = render(
      <StatefulCatalog flow={shopFlow()} estimatedAddress={{ country: "IT" }} />,
    )
    fireEvent.click(container.querySelector(".fk-catalog-add")!)
    expect(container.querySelector(".fk-catalog-tax-note")).toBeNull()
  })

  it("does not call calculateTax while the cart is empty", () => {
    const calculateTax = vi.fn()
    const { container } = render(
      <StatefulCatalog flow={shopFlow({ calculateTax })} estimatedAddress={{ country: "IT" }} />,
    )
    expect(container.querySelector(".fk-catalog-tax-note")).toBeNull()
    expect(calculateTax).not.toHaveBeenCalled()
  })

  it("does not call calculateTax without an estimatedAddress (nothing to estimate from)", () => {
    const calculateTax = vi.fn()
    const { container } = render(<StatefulCatalog flow={shopFlow({ calculateTax })} />)
    fireEvent.click(container.querySelector(".fk-catalog-add")!)
    expect(container.querySelector(".fk-catalog-tax-note")).toBeNull()
    expect(calculateTax).not.toHaveBeenCalled()
  })

  it("calls calculateTax with the estimated address once an item is added, and labels the result as an estimate", async () => {
    const calculateTax = vi.fn().mockResolvedValue({
      taxAmount: 550,
      totalWithTax: 3050,
      currency: "eur",
      breakdown: [],
    })
    const { container } = render(
      <StatefulCatalog flow={shopFlow({ calculateTax })} estimatedAddress={{ country: "IT" }} />,
    )
    fireEvent.click(container.querySelector(".fk-catalog-add")!)

    await waitFor(() => expect(container.querySelector(".fk-catalog-tax-note")).not.toBeNull())
    expect(calculateTax).toHaveBeenCalledWith(
      expect.objectContaining({ address: { country: "IT" }, addressSource: "estimated" }),
    )
    const note = container.querySelector(".fk-catalog-tax-note")!.textContent!
    expect(note).toContain("stima")
    expect(note).toContain("5,50")
    expect(note).toContain("30,50")
  })
})
