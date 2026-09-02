import { describe, expect, it } from "vitest"
import {
  buildReportRows,
  flowHasPayment,
  formatMoney,
  getPendingPayment,
  parseFlow,
  type Answers,
  type Flow,
} from "./index"

const flow: Flow = parseFlow({
  id: "shop",
  title: "Shop",
  steps: [
    { id: "intro", type: "intro", title: "Start" },
    {
      id: "pay",
      key: "pay",
      type: "payment-stripe",
      title: "Pay",
      publishableKey: "pk_test_x",
      amount: 1500,
      currency: "eur",
    },
    { id: "review", type: "review" },
    { id: "done", type: "confirmation" },
  ],
})

const collected: Answers = {
  pay: {
    status: "collected",
    confirmationTokenId: "ctoken_123",
    summary: { type: "card", brand: "visa", last4: "4242" },
  },
}

describe("formatMoney", () => {
  it("scales minor units by the currency's fraction digits", () => {
    expect(formatMoney(1500, "eur", "it-IT").replace(/\s/g, " ")).toContain("15,00")
    expect(formatMoney(1500, "usd", "en-US")).toBe("$15.00")
  })

  it("treats zero-decimal currencies as whole units", () => {
    expect(formatMoney(1500, "jpy", "en-US")).toBe("¥1,500")
  })

  it("falls back to a plain string when Intl can't format the code", () => {
    // `!!` is not a valid ISO code shape — Intl throws, the catch branch takes over.
    expect(formatMoney(1500, "!!")).toBe("1500 !!")
  })
})

describe("flowHasPayment", () => {
  it("is true when the flow contains a payment-stripe step", () => {
    expect(flowHasPayment(flow)).toBe(true)
  })

  it("is false otherwise", () => {
    const plain = parseFlow({
      id: "p",
      title: "P",
      steps: [
        { id: "intro", type: "intro", title: "S" },
        { id: "review", type: "review" },
        { id: "done", type: "confirmation" },
      ],
    })
    expect(flowHasPayment(plain)).toBe(false)
  })
})

describe("getPendingPayment", () => {
  it("returns null when no method has been collected", () => {
    expect(getPendingPayment(flow, {})).toBeNull()
  })

  it("returns the token and the step's amount/currency once collected", () => {
    expect(getPendingPayment(flow, collected)).toEqual({
      stepId: "pay",
      confirmationTokenId: "ctoken_123",
      amount: 1500,
      currency: "eur",
      summary: { type: "card", brand: "visa", last4: "4242" },
    })
  })

  it("returns null for a malformed value", () => {
    expect(getPendingPayment(flow, { pay: { status: "collected" } as never })).toBeNull()
  })
})

describe("buildReportRows: payment-stripe row", () => {
  it("renders a card as brand + last4", () => {
    const row = buildReportRows(flow, collected).find((r) => r.stepId === "pay")
    expect(row?.value).toBe("💳 Visa •••• 4242")
  })

  it("renders a non-card method by its label", () => {
    const row = buildReportRows(flow, {
      pay: { status: "collected", confirmationTokenId: "ct_1", summary: { type: "paypal" } },
    }).find((r) => r.stepId === "pay")
    expect(row?.value).toBe("💳 PayPal")
  })

  it("shows an em dash when nothing is collected", () => {
    const row = buildReportRows(flow, {}).find((r) => r.stepId === "pay")
    expect(row?.value).toBe("—")
  })
})
