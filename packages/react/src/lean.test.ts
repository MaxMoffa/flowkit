import { describe, expect, it } from "vitest"
import { getStepComponent } from "./lean"

// This file must never import "./index": the registry is a module-scope singleton, and
// the batteries-included entry would register everything and make the test vacuous.
describe("lean entry", () => {
  it("registers no step component on its own", () => {
    expect(getStepComponent("intro")).toBeUndefined()
    expect(getStepComponent("text")).toBeUndefined()
    expect(getStepComponent("confirmation")).toBeUndefined()
  })

  it("registers a step, and only that one, when its opt-in entry is imported", async () => {
    await import("./steps/entries/intro")
    expect(getStepComponent("intro")).toBeDefined()
    expect(getStepComponent("text")).toBeUndefined()
  })

  it("shares one registry with the opt-in entries", async () => {
    const { getStepComponent: fromRegistry } = await import("./registry")
    await import("./steps/entries/text")
    expect(fromRegistry("text")).toBe(getStepComponent("text"))
  })
})
