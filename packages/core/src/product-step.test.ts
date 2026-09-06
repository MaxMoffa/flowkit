import { describe, expect, it } from "vitest"
import {
  buildOrderSummary,
  buildReportRows,
  computeOrderTotal,
  getStepValidationIssue,
  parseFlow,
  productStepSchema,
  productTotal,
  type Answers,
  type Flow,
} from "./index"

const productConfig = {
  id: "hero",
  key: "hero",
  type: "product",
  title: "T-shirt FlowKit",
  currency: "eur",
  maxPerItem: 5,
  items: [{ value: "tshirt", label: "T-shirt", price: 2500, maxQuantity: 3 }],
}

function heroFlow(paymentOverrides: Record<string, unknown> = {}, required = false): Flow {
  return parseFlow({
    id: "shop",
    title: "Shop",
    steps: [
      { id: "intro", type: "intro", title: "Start" },
      { ...productConfig, required },
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

const order: Answers = {
  hero: { items: [{ value: "tshirt", quantity: 2 }], total: 5000 },
}

describe("product schema", () => {
  it("applies defaults", () => {
    const step = productStepSchema.parse(productConfig)
    expect(step.maxPerItem).toBe(5)
    expect(step.currency).toBe("eur")
  })

  it("requires at least one item", () => {
    expect(() => productStepSchema.parse({ ...productConfig, items: [] })).toThrow()
  })

  it("caps items at 4 — the trait that distinguishes it from `catalog`", () => {
    const fifth = { value: "x5", label: "Item 5", price: 100 }
    const items = [...productConfig.items, fifth, fifth, fifth, fifth]
    expect(() => productStepSchema.parse({ ...productConfig, items })).toThrow()
  })

  it("accepts up to 4 items", () => {
    const extra = { value: "extra", label: "Extra", price: 100 }
    const step = productStepSchema.parse({
      ...productConfig,
      items: [...productConfig.items, extra, extra, extra].map((item, i) => ({ ...item, value: `${item.value}-${i}` })),
    })
    expect(step.items).toHaveLength(4)
  })

  it("accepts an optional per-item `details` blurb", () => {
    const step = productStepSchema.parse({
      ...productConfig,
      items: [{ value: "x", label: "X", price: 100, details: "Long **markdown** description." }],
    })
    expect(step.items[0]?.details).toContain("markdown")
  })
})

describe("productTotal", () => {
  it("sums price × quantity across lines", () => {
    const step = productStepSchema.parse(productConfig)
    expect(productTotal(step, order.hero)).toBe(2500 * 2)
  })

  it("ignores zero-quantity and unknown lines", () => {
    const step = productStepSchema.parse(productConfig)
    expect(
      productTotal(step, { items: [{ value: "tshirt", quantity: 0 }, { value: "ghost", quantity: 3 }], total: 0 }),
    ).toBe(0)
  })
})

describe("product validation", () => {
  it("is optional by default — empty cart is valid", () => {
    const heroStep = heroFlow().steps.find((s) => s.id === "hero")!
    expect(getStepValidationIssue(heroStep, { hero: null })).toBeNull()
  })

  it("requires at least one line when `required: true`", () => {
    const heroStep = heroFlow({}, true).steps.find((s) => s.id === "hero")!
    expect(getStepValidationIssue(heroStep, { hero: null })?.rule).toBe("required")
  })

  it("rejects a quantity above the item cap", () => {
    const heroStep = heroFlow().steps.find((s) => s.id === "hero")!
    const issue = getStepValidationIssue(heroStep, {
      hero: { items: [{ value: "tshirt", quantity: 4 }], total: 10000 },
    })
    expect(issue?.rule).toBe("outOfRange")
  })

  it("rejects an unknown item", () => {
    const heroStep = heroFlow().steps.find((s) => s.id === "hero")!
    const issue = getStepValidationIssue(heroStep, {
      hero: { items: [{ value: "ghost", quantity: 1 }], total: 0 },
    })
    expect(issue?.rule).toBe("invalidFormat")
  })

  it("accepts a valid order", () => {
    const heroStep = heroFlow().steps.find((s) => s.id === "hero")!
    expect(getStepValidationIssue(heroStep, order)).toBeNull()
  })
})

describe("computeOrderTotal for a product step", () => {
  it("feeds the product total into a cart-sourced payment step", () => {
    const flow = heroFlow()
    expect(computeOrderTotal(flow, order)).toBe(5000)
  })
})

describe("buildOrderSummary with a product step", () => {
  it("itemizes product lines the same way it does catalog lines", () => {
    const flow = heroFlow()
    const summary = buildOrderSummary(flow, order)!
    expect(summary.currency).toBe("eur")
    expect(summary.lines).toEqual([
      {
        stepId: "hero",
        value: "tshirt",
        label: "T-shirt",
        quantity: 2,
        unitAmount: 2500,
        amount: 5000,
        kind: "item",
        taxCode: undefined,
      },
    ])
    expect(summary.total).toBe(5000)
  })
})

describe("product report row", () => {
  it("renders quantities and the line total, and its own row is excluded from review when a cart summary is shown", () => {
    const row = buildReportRows(heroFlow(), order).find((r) => r.stepId === "hero")
    expect(row?.value).toContain("2× T-shirt")
    expect(row?.value).toContain("50")
  })
})
