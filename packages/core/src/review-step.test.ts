import { describe, expect, it } from "vitest"
import { reviewStepSchema } from "./review-step"

describe("reviewStepSchema.ctaFootnote", () => {
  it("is optional", () => {
    expect(reviewStepSchema.parse({ id: "review", type: "review" }).ctaFootnote).toBeUndefined()
  })

  it("accepts a literal string and a ContentText object", () => {
    expect(
      reviewStepSchema.parse({ id: "review", type: "review", ctaFootnote: "Accetti i termini" })
        .ctaFootnote,
    ).toBe("Accetti i termini")
    expect(
      reviewStepSchema.parse({
        id: "review",
        type: "review",
        ctaFootnote: { key: "platform.submitDisclaimer" },
      }).ctaFootnote,
    ).toEqual({ key: "platform.submitDisclaimer" })
  })
})
