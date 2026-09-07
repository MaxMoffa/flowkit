import { describe, expect, it } from "vitest"
import { parseFlow, resolveErrorScreen, type Flow } from "./index"

function makeFlow(overrides: Record<string, unknown> = {}): Flow {
  return parseFlow({
    id: "shop",
    title: "Shop",
    steps: [
      { id: "intro", type: "intro", title: "Start" },
      { id: "notes", key: "notes", type: "notes", title: "Notes", required: false },
      { id: "review", type: "review" },
      { id: "done", type: "confirmation" },
    ],
    ...overrides,
  })
}

function makePaymentFlow(overrides: Record<string, unknown> = {}): Flow {
  return parseFlow({
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
    ...overrides,
  })
}

describe("resolveErrorScreen", () => {
  it("falls back to the shipped i18n defaults when nothing is configured", () => {
    const resolved = resolveErrorScreen(makeFlow())
    expect(resolved.title).toBe("Qualcosa è andato storto")
    expect(resolved.message).toBe("Si è verificato un errore. Riprova.")
    expect(resolved.image.kind).toBe("icon")
    expect(resolved.image.value).toContain("<svg")
  })

  it("uses the locale-appropriate defaults", () => {
    const resolved = resolveErrorScreen(makeFlow({ locale: "en" }))
    expect(resolved.title).toBe("Something went wrong")
  })

  it("payload fields win over flow.errorScreen, which wins over defaults", () => {
    const flow = makeFlow({
      errorScreen: { title: "Config title", message: "Config message" },
    })
    expect(resolveErrorScreen(flow).title).toBe("Config title")
    expect(resolveErrorScreen(flow, { title: "Payload title" }).title).toBe("Payload title")
    expect(resolveErrorScreen(flow, { title: "Payload title" }).message).toBe("Config message")
  })

  it("default actions: retryable payment flow → retry + change-payment jumping to the payment step", () => {
    const flow = makePaymentFlow({ errorScreen: {} })
    const { actions } = resolveErrorScreen(flow, { canRetry: true })
    expect(actions.map((a) => a.action.kind)).toEqual(["retry", "goToStep"])
    expect(actions[0]!.label).toBe("Riprova")
    const goTo = actions[1]!
    expect(goTo.action).toMatchObject({ kind: "goToStep", stepId: "pay" })
    expect(goTo.label).toBe("Cambia metodo di pagamento")
  })

  it("default actions: no payment step → retry + back; non-retryable → back only", () => {
    const flow = makeFlow({ errorScreen: {} })
    expect(resolveErrorScreen(flow, { canRetry: true }).actions.map((a) => a.action.kind)).toEqual([
      "retry",
      "back",
    ])
    expect(resolveErrorScreen(flow, { canRetry: false }).actions.map((a) => a.action.kind)).toEqual([
      "back",
    ])
  })

  it("an explicit actions list (payload or config) replaces the defaults, and each gets a default label", () => {
    const flow = makeFlow({
      errorScreen: { actions: [{ kind: "restart" }, { kind: "home", url: "https://example.com" }] },
    })
    const { actions } = resolveErrorScreen(flow)
    expect(actions.map((a) => a.action.kind)).toEqual(["restart", "home"])
    expect(actions.map((a) => a.label)).toEqual(["Ricomincia", "Torna alla home"])
  })

  it("a per-action label overrides its default", () => {
    const flow = makeFlow({ errorScreen: { actions: [{ kind: "retry", label: "Ancora" }] } })
    expect(resolveErrorScreen(flow).actions[0]!.label).toBe("Ancora")
  })

  it("parseFlow accepts and preserves flow.errorScreen", () => {
    const flow = makeFlow({ errorScreen: { title: "x", actions: [{ kind: "dismiss" }] } })
    expect(flow.errorScreen).toEqual({ title: "x", actions: [{ kind: "dismiss" }] })
  })
})
