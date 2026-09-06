import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, waitFor } from "@testing-library/react"
import { parseFlow, type AnswerValue, type ProductStep, type Flow } from "@flowkit-io/core"
import "@flowkit-io/core"
import { ProductStepView } from "./product"

function heroFlow(paymentOverrides: Record<string, unknown> = {}, items?: Record<string, unknown>[]): Flow {
  return parseFlow({
    id: "shop",
    title: "Shop",
    steps: [
      { id: "intro", type: "intro", title: "Start" },
      {
        id: "hero",
        key: "hero",
        type: "product",
        title: "T-shirt FlowKit",
        currency: "eur",
        items: items ?? [
          {
            value: "tshirt",
            label: "T-shirt",
            price: 2500,
            details: "**Cotone** organico.",
          },
        ],
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

function StatefulProduct({
  flow,
  estimatedAddress,
}: {
  flow: Flow
  estimatedAddress?: { country: string }
}) {
  const [value, setValue] = useState<AnswerValue>(null)
  const step = flow.steps.find((s) => s.type === "product") as ProductStep
  return (
    <ProductStepView
      step={step}
      value={value}
      onChange={setValue}
      flow={flow}
      answers={value ? { hero: value } : {}}
      meta={{}}
      onMetaChange={() => {}}
      estimatedAddress={estimatedAddress}
    />
  )
}

describe("ProductStepView: hero layout", () => {
  it("renders a single item as a solo hero card", () => {
    const { container } = render(<StatefulProduct flow={heroFlow()} />)
    const cards = container.querySelectorAll(".fk-product-card")
    expect(cards).toHaveLength(1)
    expect(cards[0]?.classList.contains("fk-product-card-solo")).toBe(true)
  })

  it("renders 2-4 items as a plain vertical list, no solo modifier", () => {
    const items = [
      { value: "a", label: "A", price: 1000 },
      { value: "b", label: "B", price: 2000 },
      { value: "c", label: "C", price: 3000 },
    ]
    const { container } = render(<StatefulProduct flow={heroFlow({}, items)} />)
    const cards = container.querySelectorAll(".fk-product-card")
    expect(cards).toHaveLength(3)
    cards.forEach((card) => expect(card.classList.contains("fk-product-card-solo")).toBe(false))
  })

  it("keeps the list markup a flat <ul> of cards for 2-4 items (desktop grid is pure CSS via :has(), not a JS layout branch)", () => {
    const items = [
      { value: "a", label: "A", price: 1000 },
      { value: "b", label: "B", price: 2000 },
    ]
    const { container } = render(<StatefulProduct flow={heroFlow({}, items)} />)
    const list = container.querySelector(".fk-product-list")
    expect(list?.tagName).toBe("UL")
    // The >=1024px grid rule (`.fk-product-list:has(.fk-product-card:nth-child(2))`,
    // style.css) needs every card to be a direct <li> child in document order —
    // assert that shape here since jsdom doesn't evaluate real media queries.
    expect(list?.children.length).toBe(2)
    Array.from(list?.children ?? []).forEach((child) => {
      expect(child.tagName).toBe("LI")
      expect(child.classList.contains("fk-product-card")).toBe(true)
    })
  })

  it("adds an item and steps its quantity up/down", () => {
    const { container } = render(<StatefulProduct flow={heroFlow()} />)
    fireEvent.click(container.querySelector(".fk-product-add")!)
    expect(container.querySelector(".fk-product-qty")?.textContent).toBe("1")

    const [decrease, increase] = container.querySelectorAll(".fk-product-step")
    fireEvent.click(increase!)
    expect(container.querySelector(".fk-product-qty")?.textContent).toBe("2")
    fireEvent.click(decrease!)
    fireEvent.click(decrease!)
    // Back to zero quantity -> the add button reappears.
    expect(container.querySelector(".fk-product-add")).not.toBeNull()
  })

  it("opens the details sheet for an item with `details`", () => {
    const { container } = render(<StatefulProduct flow={heroFlow()} />)
    fireEvent.click(container.querySelector(".fk-product-card-hit")!)
    expect(container.ownerDocument.querySelector(".fk-product-sheet")).not.toBeNull()
    fireEvent.click(container.ownerDocument.querySelector(".fk-product-sheet-close")!)
    expect(container.ownerDocument.querySelector(".fk-product-sheet")).toBeNull()
  })
})

describe("ProductStepView: item image", () => {
  it("renders a hero banner image (not a small badge) when the item has an image", () => {
    const items = [
      {
        value: "tshirt",
        label: "T-shirt",
        price: 2500,
        image: { kind: "image", value: "https://example.com/tshirt.jpg" },
      },
    ]
    const { container } = render(<StatefulProduct flow={heroFlow({}, items)} />)
    const hero = container.querySelector(".fk-product-card-image")
    expect(hero).not.toBeNull()
    const img = hero!.querySelector("img")
    expect(img).not.toBeNull()
    expect(img!.getAttribute("src")).toBe("https://example.com/tshirt.jpg")
  })

  it("leaves no empty hero slot when the item has no image", () => {
    const { container } = render(<StatefulProduct flow={heroFlow()} />)
    expect(container.querySelector(".fk-product-card-image")).toBeNull()
  })
})

describe("ProductStepView: tax estimate", () => {
  it("shows nothing when no calculateTax is wired on the payment step", () => {
    const { container } = render(
      <StatefulProduct flow={heroFlow()} estimatedAddress={{ country: "IT" }} />,
    )
    fireEvent.click(container.querySelector(".fk-product-add")!)
    expect(container.querySelector(".fk-product-tax-note")).toBeNull()
  })

  it("does not call calculateTax while the cart is empty", () => {
    const calculateTax = vi.fn()
    const { container } = render(
      <StatefulProduct flow={heroFlow({ calculateTax })} estimatedAddress={{ country: "IT" }} />,
    )
    expect(container.querySelector(".fk-product-tax-note")).toBeNull()
    expect(calculateTax).not.toHaveBeenCalled()
  })

  it("does not call calculateTax without an estimatedAddress (nothing to estimate from)", () => {
    const calculateTax = vi.fn()
    const { container } = render(<StatefulProduct flow={heroFlow({ calculateTax })} />)
    fireEvent.click(container.querySelector(".fk-product-add")!)
    expect(container.querySelector(".fk-product-tax-note")).toBeNull()
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
      <StatefulProduct flow={heroFlow({ calculateTax })} estimatedAddress={{ country: "IT" }} />,
    )
    fireEvent.click(container.querySelector(".fk-product-add")!)

    await waitFor(() => expect(container.querySelector(".fk-product-tax-note")).not.toBeNull())
    expect(calculateTax).toHaveBeenCalledWith(
      expect.objectContaining({ address: { country: "IT" }, addressSource: "estimated" }),
    )
    const note = container.querySelector(".fk-product-tax-note")!.textContent!
    expect(note).toContain("stima")
    expect(note).toContain("5,50")
    expect(note).toContain("30,50")
  })
})

describe("ProductStepView: price tax-behavior note", () => {
  it("shows nothing next to the price when no calculateTax is wired (no real tax integration)", () => {
    const { container } = render(<StatefulProduct flow={heroFlow()} />)
    expect(container.querySelector(".fk-product-price-note")).toBeNull()
  })

  it("shows a '+ IVA' note next to the price for the default exclusive behavior", () => {
    const { container } = render(<StatefulProduct flow={heroFlow({ calculateTax: vi.fn() })} />)
    const note = container.querySelector(".fk-product-price-note")
    expect(note).not.toBeNull()
    expect(note!.textContent).toBe("+ IVA")
  })

  it("shows an 'IVA inclusa' note next to the price when taxBehavior is inclusive", () => {
    const { container } = render(
      <StatefulProduct flow={heroFlow({ calculateTax: vi.fn(), taxBehavior: "inclusive" })} />,
    )
    const note = container.querySelector(".fk-product-price-note")
    expect(note).not.toBeNull()
    expect(note!.textContent).toBe("IVA inclusa")
  })
})
