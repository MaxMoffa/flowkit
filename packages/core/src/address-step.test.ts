import { describe, expect, it } from "vitest"
import { addressStepSchema, asAddressValue, getStepValidationIssue, parseFlow } from "./index"

describe("address step", () => {
  it("applies defaults", () => {
    const step = addressStepSchema.parse({ id: "a", type: "address", title: "Indirizzo" })
    expect(step.requireFullAddress).toBe(false)
  })

  const step = parseFlow({
    id: "f",
    title: "F",
    steps: [
      { id: "intro", type: "intro", title: "S" },
      { id: "addr", key: "addr", type: "address", title: "Indirizzo" },
      { id: "review", type: "review" },
      { id: "done", type: "confirmation" },
    ],
  }).steps.find((s) => s.id === "addr")!

  it("accepts a country + postal code", () => {
    expect(getStepValidationIssue(step, { addr: { country: "IT", postalCode: "20121" } })).toBeNull()
  })

  it("rejects a bare country with no postal code or line", () => {
    expect(getStepValidationIssue(step, { addr: { country: "IT" } })?.rule).toBe("required")
  })

  it("asAddressValue needs a 2-letter country", () => {
    expect(asAddressValue({ country: "Italia" })).toBeNull()
    expect(asAddressValue({ country: "IT" })).toEqual({ country: "IT" })
  })
})

// `buildTaxInput` itself (order lines + address gathering, `estimatedAddress` fallback) is
// covered in tax.test.ts, which owns that function.
