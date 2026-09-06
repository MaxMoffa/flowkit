import { describe, expect, it } from "vitest"
import { parseFlow, resolveText, resolveContentText, type Flow } from "./index"

function makeFlow(overrides: Partial<Flow> = {}): Flow {
  return parseFlow({
    id: "i18n-test",
    title: "I18n test",
    steps: [
      { id: "welcome", type: "intro" },
      { id: "end", type: "confirmation" },
    ],
    ...overrides,
  })
}

describe("resolveText", () => {
  it("uses flow.texts when set, over everything else", () => {
    const flow = makeFlow({ texts: { back: "Custom Back" }, locale: "it" })
    expect(resolveText(flow, "back")).toBe("Custom Back")
  })

  it("falls back to the locale dictionary when flow.texts has no entry", () => {
    const flow = makeFlow({ locale: "en" })
    expect(resolveText(flow, "back")).toBe("Back")
  })

  it("falls back to the Italian dictionary when the flow's locale has no entry for the key", () => {
    const flow = makeFlow({ locale: "fr" })
    expect(resolveText(flow, "back")).toBe("Indietro")
  })

  it("falls back to the caller-supplied fallback when the key is in no dictionary", () => {
    const flow = makeFlow({ locale: "it" })
    expect(resolveText(flow, "totally-custom-key", "Default text")).toBe("Default text")
  })

  it("falls back to the raw key when nothing else resolves", () => {
    const flow = makeFlow({ locale: "it" })
    expect(resolveText(flow, "totally-custom-key")).toBe("totally-custom-key")
  })

  it("defaults preserve the previous hardcoded chrome text", () => {
    const flow = makeFlow({ locale: "it" })
    expect(resolveText(flow, "continue")).toBe("Continua")
    expect(resolveText(flow, "back")).toBe("Indietro")
    expect(resolveText(flow, "backAriaLabel")).toBe("Indietro")
    expect(resolveText(flow, "returnToReview")).toBe("Torna al riepilogo")
    expect(resolveText(flow, "confirmationRestart")).toBe("Nuova segnalazione")
    expect(resolveText(flow, "confirmationHome")).toBe("Torna alla home")
    expect(resolveText(flow, "submit")).toBe("Invia segnalazione ✓")
    expect(resolveText(flow, "fileAddPlaceholder")).toBe("Aggiungi file")
    expect(resolveText(flow, "attachmentSuffix")).toBe("allegato/i")
  })
})

describe("resolveContentText", () => {
  it("returns a literal string value unchanged", () => {
    const flow = makeFlow()
    expect(resolveContentText(flow, "Ciao mondo")).toBe("Ciao mondo")
  })

  it("resolves an object value from flow.content when the key is present", () => {
    const flow = makeFlow({ content: { greeting: "Ciao dal dizionario" } })
    expect(resolveContentText(flow, { key: "greeting", fallback: "Ciao di default" })).toBe(
      "Ciao dal dizionario",
    )
  })

  it("falls back to the value's own fallback when flow.content has no entry", () => {
    const flow = makeFlow()
    expect(resolveContentText(flow, { key: "missing", fallback: "Testo di riserva" })).toBe(
      "Testo di riserva",
    )
  })

  it("falls back to the raw key when neither flow.content nor fallback resolve", () => {
    const flow = makeFlow()
    expect(resolveContentText(flow, { key: "totally.missing" })).toBe("totally.missing")
  })

  it("ignores flow.content entries that don't match the requested key", () => {
    const flow = makeFlow({ content: { other: "Altro" } })
    expect(resolveContentText(flow, { key: "greeting", fallback: "Ciao di default" })).toBe(
      "Ciao di default",
    )
  })
})
