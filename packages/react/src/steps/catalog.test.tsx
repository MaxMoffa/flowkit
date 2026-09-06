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

describe("CatalogStepView: item image", () => {
  function flowWithImage(image?: Record<string, unknown>): Flow {
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
          items: [{ value: "tshirt", label: "T-shirt", price: 2500, ...(image ? { image } : {}) }],
        },
        { id: "done", type: "confirmation" },
      ],
    })
  }

  it("renders a real product thumbnail (not a small badge) when the item has an image", () => {
    const flow = flowWithImage({ kind: "image", value: "https://example.com/tshirt.jpg" })
    const { container } = render(<StatefulCatalog flow={flow} />)
    const thumb = container.querySelector(".fk-catalog-item-thumb")
    expect(thumb).not.toBeNull()
    const img = thumb!.querySelector("img")
    expect(img).not.toBeNull()
    expect(img!.getAttribute("src")).toBe("https://example.com/tshirt.jpg")
  })

  it("leaves no empty thumbnail slot when the item has no image", () => {
    const { container } = render(<StatefulCatalog flow={flowWithImage()} />)
    expect(container.querySelector(".fk-catalog-item-thumb")).toBeNull()
  })
})

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

describe("CatalogStepView: filters", () => {
  function flowWithFilters(): Flow {
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
          filters: [
            { label: "Bestseller", icon: { kind: "emoji", value: "🔥" }, tag: "bestseller" },
            { label: "Eco", tag: "eco" },
          ],
          items: [
            { value: "tshirt", label: "T-shirt", price: 2500, tags: ["bestseller"] },
            { value: "mug", label: "Tazza", price: 1200, tags: ["eco"] },
            { value: "stickers", label: "Adesivi", price: 500 },
          ],
        },
        { id: "done", type: "confirmation" },
      ],
    })
  }

  it("renders no filter row when the step has no `filters` configured (no regression)", () => {
    const { container } = render(<StatefulCatalog flow={shopFlow()} />)
    expect(container.querySelector(".fk-catalog-filter-row")).toBeNull()
  })

  it("shows every item when no filter is active", () => {
    const { container } = render(<StatefulCatalog flow={flowWithFilters()} />)
    expect(container.querySelectorAll(".fk-catalog-item")).toHaveLength(3)
  })

  it("activating a filter hides items without the matching tag, keeps the tagged one, and drops untagged items", () => {
    const { container, getByRole } = render(<StatefulCatalog flow={flowWithFilters()} />)
    fireEvent.click(getByRole("button", { name: /Bestseller/, pressed: false }))

    const items = container.querySelectorAll(".fk-catalog-item")
    expect(items).toHaveLength(1)
    expect(items[0]!.textContent).toContain("T-shirt")
  })

  it("marks the active chip with aria-pressed=true and toggles it back off on a second click", () => {
    const { getByRole } = render(<StatefulCatalog flow={flowWithFilters()} />)
    const chip = getByRole("button", { name: /Bestseller/ })
    expect(chip.getAttribute("aria-pressed")).toBe("false")

    fireEvent.click(chip)
    expect(chip.getAttribute("aria-pressed")).toBe("true")

    fireEvent.click(chip)
    expect(chip.getAttribute("aria-pressed")).toBe("false")
  })

  it("two active filters OR-match: shows the union of items tagged with either", () => {
    const { container, getByRole } = render(<StatefulCatalog flow={flowWithFilters()} />)
    fireEvent.click(getByRole("button", { name: /Bestseller/ }))
    fireEvent.click(getByRole("button", { name: /Eco/ }))

    const labels = [...container.querySelectorAll(".fk-catalog-item")].map((el) => el.textContent)
    expect(labels.some((text) => text?.includes("T-shirt"))).toBe(true)
    expect(labels.some((text) => text?.includes("Tazza"))).toBe(true)
    expect(labels.some((text) => text?.includes("Adesivi"))).toBe(false)
    expect(container.querySelectorAll(".fk-catalog-item")).toHaveLength(2)
  })

  it("deselecting the only active filter restores the full list", () => {
    const { container, getByRole } = render(<StatefulCatalog flow={flowWithFilters()} />)
    const chip = getByRole("button", { name: /Bestseller/ })
    fireEvent.click(chip)
    expect(container.querySelectorAll(".fk-catalog-item")).toHaveLength(1)

    fireEvent.click(chip)
    expect(container.querySelectorAll(".fk-catalog-item")).toHaveLength(3)
  })

  it("shows the empty-state message when the active filter matches nothing, instead of a silent empty list", () => {
    const flow = parseFlow({
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
          filters: [{ label: "Vegan", tag: "vegan" }],
          items: [{ value: "tshirt", label: "T-shirt", price: 2500, tags: ["bestseller"] }],
        },
        { id: "done", type: "confirmation" },
      ],
    })
    const { container, getByText } = render(<StatefulCatalog flow={flow} />)
    fireEvent.click(container.querySelector(".fk-catalog-filter-chip")!)

    expect(container.querySelectorAll(".fk-catalog-item")).toHaveLength(0)
    expect(getByText("Nessun prodotto per questo filtro.")).not.toBeNull()
  })

  it("renders the filter icon when the filter sets one", () => {
    const { container } = render(<StatefulCatalog flow={flowWithFilters()} />)
    const chips = container.querySelectorAll(".fk-catalog-filter-chip")
    expect(chips[0]!.querySelector(".fk-catalog-filter-icon")).not.toBeNull()
    expect(chips[1]!.querySelector(".fk-catalog-filter-icon")).toBeNull()
  })
})

describe("CatalogStepView: price tax-behavior note", () => {
  it("shows nothing next to the price when no calculateTax is wired (no real tax integration)", () => {
    const { container } = render(<StatefulCatalog flow={shopFlow()} />)
    expect(container.querySelector(".fk-catalog-price-note")).toBeNull()
  })

  it("shows nothing when taxBehavior is set but calculateTax itself is absent", () => {
    const { container } = render(<StatefulCatalog flow={shopFlow({ taxBehavior: "inclusive" })} />)
    expect(container.querySelector(".fk-catalog-price-note")).toBeNull()
  })

  it("shows a '+ IVA' note next to the price for the default exclusive behavior", () => {
    const { container } = render(<StatefulCatalog flow={shopFlow({ calculateTax: vi.fn() })} />)
    const note = container.querySelector(".fk-catalog-price-note")
    expect(note).not.toBeNull()
    expect(note!.textContent).toBe("+ IVA")
  })

  it("shows an 'IVA inclusa' note next to the price when taxBehavior is inclusive", () => {
    const { container } = render(
      <StatefulCatalog flow={shopFlow({ calculateTax: vi.fn(), taxBehavior: "inclusive" })} />,
    )
    const note = container.querySelector(".fk-catalog-price-note")
    expect(note).not.toBeNull()
    expect(note!.textContent).toBe("IVA inclusa")
  })
})
