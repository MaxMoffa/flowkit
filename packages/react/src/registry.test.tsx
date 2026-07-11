import { describe, expect, it } from "vitest"
import { registerStepComponent, getStepComponent } from "./index"
import type { StepComponentProps } from "./types"

describe("react step component registry", () => {
  it("resolves the built-in step components", () => {
    for (const type of [
      "intro",
      "select-cards",
      "scale",
      "chips",
      "faces",
      "notes",
      "photo",
      "date-time",
      "nps",
      "multi-select",
      "text",
      "review",
      "confirmation",
    ]) {
      expect(getStepComponent(type)).toBeTypeOf("function")
    }
  })

  it("does not register map steps by default (opt-in entry points)", () => {
    expect(getStepComponent("location")).toBeUndefined()
    expect(getStepComponent("location-leaflet")).toBeUndefined()
  })

  it("registers 'location' after importing @flowkit-io/react/map-maplibre", async () => {
    await import("./map-maplibre")
    expect(getStepComponent("location")).toBeTypeOf("function")
  })

  it("registers 'location-leaflet' after importing @flowkit-io/react/map-leaflet", async () => {
    await import("./map-leaflet")
    expect(getStepComponent("location-leaflet")).toBeTypeOf("function")
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
