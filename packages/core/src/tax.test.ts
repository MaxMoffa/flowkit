import { describe, expect, it } from "vitest"
import { buildTaxInput, parseFlow, type Answers, type Flow } from "./index"

function shopFlow(): Flow {
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
        items: [
          { value: "tshirt", label: "T-shirt", price: 2500, taxCode: "txcd_99999999" },
          { value: "sticker", label: "Adesivo", price: 500 },
        ],
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
      },
      { id: "review", type: "review" },
      { id: "done", type: "confirmation" },
    ],
  })
}

const cartOnly: Answers = {
  cart: {
    items: [{ value: "tshirt", quantity: 2 }, { value: "sticker", quantity: 1 }],
    total: 5500,
  },
}

describe("buildTaxInput", () => {
  it("returns null when the cart is empty", () => {
    expect(buildTaxInput(shopFlow(), {}, "exclusive")).toBeNull()
  })

  it("returns null when there's an order but no address at all — collected or estimated", () => {
    expect(buildTaxInput(shopFlow(), cartOnly, "exclusive")).toBeNull()
  })

  it("uses the flow's own `address` step answer, marked collected", () => {
    const answers: Answers = { ...cartOnly, address: { country: "IT", postalCode: "20100" } }
    const input = buildTaxInput(shopFlow(), answers, "exclusive")
    expect(input?.addressSource).toBe("collected")
    expect(input?.address).toEqual({ country: "IT", postalCode: "20100" })
    expect(input?.lines).toEqual([
      { reference: "cart:tshirt", amount: 5000, quantity: 2, taxCode: "txcd_99999999" },
      { reference: "cart:sticker", amount: 500, quantity: 1, taxCode: undefined },
    ])
  })

  it("returns null with a collected address but an empty order", () => {
    expect(buildTaxInput(shopFlow(), { address: { country: "IT" } }, "exclusive")).toBeNull()
  })

  it("falls back to `estimatedAddress` when the `address` step hasn't been answered yet, marked estimated", () => {
    const input = buildTaxInput(shopFlow(), cartOnly, "exclusive", { country: "FR" })
    expect(input?.addressSource).toBe("estimated")
    expect(input?.address).toEqual({ country: "FR" })
  })

  it("prefers the collected address over the estimated one when both are present", () => {
    const answers: Answers = { ...cartOnly, address: { country: "IT" } }
    const input = buildTaxInput(shopFlow(), answers, "exclusive", { country: "FR" })
    expect(input?.addressSource).toBe("collected")
    expect(input?.address).toEqual({ country: "IT" })
  })

  it("ignores a malformed `estimatedAddress` (no valid 2-letter country)", () => {
    expect(buildTaxInput(shopFlow(), cartOnly, "exclusive", { country: "Italy" })).toBeNull()
    expect(buildTaxInput(shopFlow(), cartOnly, "exclusive", {})).toBeNull()
  })

  it("passes `taxBehavior` through unchanged", () => {
    const input = buildTaxInput(shopFlow(), cartOnly, "inclusive", { country: "FR" })
    expect(input?.taxBehavior).toBe("inclusive")
  })
})
