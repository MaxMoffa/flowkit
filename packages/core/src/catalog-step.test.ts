import { describe, expect, it } from "vitest"
import {
  buildOrderSummary,
  buildReportRows,
  catalogStepSchema,
  catalogTotal,
  computeOrderTotal,
  getPendingPayment,
  getStepValidationIssue,
  parseFlow,
  resolvePaymentAmount,
  type Answers,
  type Flow,
} from "./index"

const catalogConfig = {
  id: "cart",
  key: "cart",
  type: "catalog",
  title: "Prodotti",
  currency: "eur",
  maxPerItem: 5,
  items: [
    { value: "tshirt", label: "T-shirt", price: 2500 },
    { value: "mug", label: "Tazza", price: 1200, maxQuantity: 2 },
    { value: "sticker", label: "Adesivo", price: 0 },
  ],
}

function shopFlow(paymentOverrides: Record<string, unknown> = {}): Flow {
  return parseFlow({
    id: "shop",
    title: "Shop",
    steps: [
      { id: "intro", type: "intro", title: "Start" },
      catalogConfig,
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
  cart: { items: [{ value: "tshirt", quantity: 2 }, { value: "mug", quantity: 1 }], total: 6200 },
}

describe("catalog schema", () => {
  it("applies defaults", () => {
    const step = catalogStepSchema.parse(catalogConfig)
    expect(step.minItems).toBe(0)
    expect(step.maxPerItem).toBe(5)
    expect(step.currency).toBe("eur")
  })

  it("requires at least one item", () => {
    expect(() => catalogStepSchema.parse({ ...catalogConfig, items: [] })).toThrow()
  })

  it("accepts an optional per-item `details` blurb", () => {
    const step = catalogStepSchema.parse({
      ...catalogConfig,
      items: [{ value: "x", label: "X", price: 100, details: "Long **markdown** description." }],
    })
    expect(step.items[0]?.details).toContain("markdown")
  })
})

describe("catalogTotal", () => {
  it("sums price × quantity across lines", () => {
    const step = catalogStepSchema.parse(catalogConfig)
    expect(catalogTotal(step, order.cart)).toBe(2500 * 2 + 1200)
  })

  it("ignores zero-quantity and unknown lines", () => {
    const step = catalogStepSchema.parse(catalogConfig)
    expect(
      catalogTotal(step, { items: [{ value: "tshirt", quantity: 0 }, { value: "ghost", quantity: 3 }], total: 0 }),
    ).toBe(0)
  })
})

describe("catalog validation", () => {
  const cartStep = shopFlow().steps.find((s) => s.id === "cart")!

  it("rejects a quantity above the item cap", () => {
    const issue = getStepValidationIssue(cartStep, {
      cart: { items: [{ value: "mug", quantity: 3 }], total: 3600 },
    })
    expect(issue?.rule).toBe("outOfRange")
  })

  it("rejects an unknown item", () => {
    const issue = getStepValidationIssue(cartStep, {
      cart: { items: [{ value: "ghost", quantity: 1 }], total: 0 },
    })
    expect(issue?.rule).toBe("invalidFormat")
  })

  it("accepts a valid order", () => {
    expect(getStepValidationIssue(cartStep, order)).toBeNull()
  })
})

describe("computeOrderTotal + resolvePaymentAmount", () => {
  it("feeds the catalog total into a cart-sourced payment step", () => {
    const flow = shopFlow()
    expect(computeOrderTotal(flow, order)).toBe(6200)
    const paymentStep = flow.steps.find((s) => s.type === "payment-stripe")!
    expect(resolvePaymentAmount(paymentStep as never, flow, order)).toBe(6200)
  })

  it("adds the flat `amount` surcharge on top of the cart", () => {
    const flow = shopFlow({ amount: 500 })
    const paymentStep = flow.steps.find((s) => s.type === "payment-stripe")!
    expect(resolvePaymentAmount(paymentStep as never, flow, order)).toBe(6700)
  })

  it("also counts priced options selected on a radio/multi-select step", () => {
    const flow = parseFlow({
      id: "f",
      title: "F",
      steps: [
        { id: "intro", type: "intro", title: "S" },
        {
          id: "plan",
          key: "plan",
          type: "radio",
          title: "Piano",
          options: [
            { value: "basic", label: "Basic", price: 900 },
            { value: "pro", label: "Pro", price: 1900 },
          ],
        },
        { id: "review", type: "review" },
        { id: "done", type: "confirmation" },
      ],
    })
    expect(computeOrderTotal(flow, { plan: "pro" })).toBe(1900)
  })
})

describe("buildOrderSummary", () => {
  it("itemizes catalog lines, priced options and the flat surcharge", () => {
    const flow = parseFlow({
      id: "f",
      title: "F",
      steps: [
        { id: "intro", type: "intro", title: "S" },
        catalogConfig,
        {
          id: "ship",
          key: "ship",
          type: "radio",
          title: "Spedizione",
          options: [
            { value: "std", label: "Standard", price: 0 },
            { value: "exp", label: "Express", price: 700 },
          ],
        },
        {
          id: "pay",
          key: "pay",
          type: "payment-stripe",
          title: "Pay",
          publishableKey: "pk_test_x",
          amountSource: "cart",
          amount: 300,
          currency: "eur",
          description: "Commissione",
        },
        { id: "review", type: "review" },
        { id: "done", type: "confirmation" },
      ],
    })
    const summary = buildOrderSummary(flow, { ...order, ship: "exp" })!
    expect(summary.currency).toBe("eur")
    expect(summary.lines.map((l) => [l.label, l.quantity, l.amount, l.kind])).toEqual([
      ["T-shirt", 2, 5000, "item"],
      ["Tazza", 1, 1200, "item"],
      ["Express", 1, 700, "fee"],
      ["Commissione", 1, 300, "fee"],
    ])
    expect(summary.total).toBe(7200)
  })

  it("returns null when nothing in the flow is priced", () => {
    const flow = parseFlow({
      id: "f",
      title: "F",
      steps: [
        { id: "intro", type: "intro", title: "S" },
        { id: "name", key: "name", type: "text", title: "Nome" },
        { id: "review", type: "review" },
        { id: "done", type: "confirmation" },
      ],
    })
    expect(buildOrderSummary(flow, { name: "x" })).toBeNull()
  })

  it("keeps computeOrderTotal free of the payment step's own surcharge", () => {
    const flow = shopFlow({ amount: 500 })
    // catalog only: 6200; the 500 surcharge is added by resolvePaymentAmount, not here
    expect(computeOrderTotal(flow, order)).toBe(6200)
  })
})

describe("payment integration", () => {
  it("getPendingPayment reports the cart-derived amount once a method is collected", () => {
    const flow = shopFlow({ amount: 500 })
    const answers: Answers = {
      ...order,
      pay: { status: "collected", confirmationTokenId: "ct_1", summary: { type: "card", brand: "visa", last4: "4242" } },
    }
    expect(getPendingPayment(flow, answers)?.amount).toBe(6700)
  })

  it("a cart payment step needs no fixed amount", () => {
    expect(() => shopFlow()).not.toThrow()
  })

  it("a fixed payment step still requires a positive amount", () => {
    expect(() =>
      parseFlow({
        id: "f",
        title: "F",
        steps: [
          { id: "intro", type: "intro", title: "S" },
          { id: "pay", type: "payment-stripe", title: "Pay", publishableKey: "pk_test_x" },
          { id: "review", type: "review" },
          { id: "done", type: "confirmation" },
        ],
      }),
    ).toThrow()
  })
})

describe("catalog report row", () => {
  it("renders quantities and the line total", () => {
    const row = buildReportRows(shopFlow(), order).find((r) => r.stepId === "cart")
    expect(row?.value).toContain("2× T-shirt")
    expect(row?.value).toContain("1× Tazza")
    expect(row?.value).toContain("62")
  })
})
