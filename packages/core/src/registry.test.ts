import { describe, expect, it } from "vitest"
import { z } from "zod"
import { registerStepType, listRegisteredStepTypes, getStepTypeDefinition, parseFlow } from "./index"

describe("step type registry", () => {
  it("lists the 12 built-in step types after import", () => {
    const types = listRegisteredStepTypes()
    expect(types).toContain("intro")
    expect(types).toContain("confirmation")
    expect(types.length).toBeGreaterThanOrEqual(12)
  })

  it("allows registering a custom step type and using it in a flow", () => {
    const ratingStarsSchema = z.object({
      id: z.string(),
      type: z.literal("rating-stars"),
      required: z.boolean().default(true),
      maxStars: z.number().default(5),
    })

    registerStepType({
      type: "rating-stars",
      schema: ratingStarsSchema,
      validate: (_step, value) => typeof value === "number" && value > 0,
    })

    expect(getStepTypeDefinition("rating-stars")).toBeDefined()

    const flow = parseFlow({
      id: "custom-demo",
      title: "Custom",
      steps: [{ id: "rating", type: "rating-stars", maxStars: 3 }],
    })

    expect(flow.steps[0]).toMatchObject({ type: "rating-stars", maxStars: 3 })
  })

  it("rejects an unregistered step type", () => {
    expect(() =>
      parseFlow({ id: "x", title: "X", steps: [{ id: "a", type: "does-not-exist" }] }),
    ).toThrow(/Tipo di step sconosciuto/)
  })
})
