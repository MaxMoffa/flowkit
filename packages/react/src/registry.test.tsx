import { describe, expect, it } from "vitest"
import { registerStepComponent, getStepComponent } from "./index"
import type { StepComponentProps } from "./types"

describe("react step component registry", () => {
  it("resolves the 12 built-in step components", () => {
    for (const type of [
      "intro",
      "location",
      "select-cards",
      "scale",
      "chips",
      "faces",
      "notes-photo",
      "nps",
      "multi-select",
      "text",
      "review",
      "confirmation",
    ]) {
      expect(getStepComponent(type)).toBeTypeOf("function")
    }
  })

  it("allows registering a custom step component at runtime", () => {
    function RatingStarsView(_props: StepComponentProps) {
      return null
    }

    registerStepComponent("rating-stars", RatingStarsView)

    expect(getStepComponent("rating-stars")).toBe(RatingStarsView)
    expect(getStepComponent("does-not-exist")).toBeUndefined()
  })
})
