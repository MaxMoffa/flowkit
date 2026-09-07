import { describe, expect, it } from "vitest"
import { introStepSchema } from "./intro-step"

describe("introStepSchema.ctaFootnote", () => {
  it("is optional — absent by default", () => {
    const step = introStepSchema.parse({ id: "welcome", type: "intro" })
    expect(step.ctaFootnote).toBeUndefined()
  })

  it("accepts a literal string", () => {
    const step = introStepSchema.parse({
      id: "welcome",
      type: "intro",
      ctaFootnote: "Creato da un utente. [Termini](https://example.com)",
    })
    expect(step.ctaFootnote).toBe("Creato da un utente. [Termini](https://example.com)")
  })

  it("accepts a ContentText { key, fallback } for i18n", () => {
    const step = introStepSchema.parse({
      id: "welcome",
      type: "intro",
      ctaFootnote: { key: "platform.disclaimer", fallback: "…" },
    })
    expect(step.ctaFootnote).toEqual({ key: "platform.disclaimer", fallback: "…" })
  })
})
