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

  it("tags built-in intro/confirmation with the matching role", () => {
    expect(getStepTypeDefinition("intro")?.role).toBe("intro")
    expect(getStepTypeDefinition("confirmation")?.role).toBe("confirmation")
    expect(getStepTypeDefinition("text")?.role).toBeUndefined()
  })

  it("propagates a custom role through registerStepType", () => {
    registerStepType({
      type: "intro-custom-test",
      schema: z.object({ id: z.string(), type: z.literal("intro-custom-test") }),
      validate: () => true,
      role: "intro",
    })

    expect(getStepTypeDefinition("intro-custom-test")?.role).toBe("intro")
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
      steps: [
        { id: "welcome", type: "intro" },
        { id: "rating", type: "rating-stars", maxStars: 3 },
        { id: "end", type: "confirmation" },
      ],
    })

    expect(flow.steps[1]).toMatchObject({ type: "rating-stars", maxStars: 3 })
  })

  it("rejects an unregistered step type", () => {
    expect(() =>
      parseFlow({ id: "x", title: "X", steps: [{ id: "a", type: "does-not-exist" }] }),
    ).toThrow(/Unknown step type/)
  })

  it("propagates role:\"logic\" through registerStepType", () => {
    registerStepType({
      type: "logic-test",
      schema: z.object({ id: z.string(), type: z.literal("logic-test") }),
      validate: () => true,
      role: "logic",
    })

    expect(getStepTypeDefinition("logic-test")?.role).toBe("logic")
  })

  it("defaults includeInSummary to undefined (treated as true) and honors an explicit false", () => {
    registerStepType({
      type: "summary-default-test",
      schema: z.object({ id: z.string(), type: z.literal("summary-default-test") }),
      validate: () => true,
    })
    registerStepType({
      type: "summary-excluded-test",
      schema: z.object({ id: z.string(), type: z.literal("summary-excluded-test") }),
      validate: () => true,
      includeInSummary: false,
    })

    expect(getStepTypeDefinition("summary-default-test")?.includeInSummary).toBeUndefined()
    expect(getStepTypeDefinition("summary-excluded-test")?.includeInSummary).toBe(false)
  })

  it("passes the step's meta bag as a 4th argument to validate", () => {
    let receivedMeta: Record<string, unknown> | undefined
    registerStepType({
      type: "meta-aware-test",
      schema: z.object({ id: z.string(), type: z.literal("meta-aware-test") }),
      validate: (_step, _value, _answers, meta) => {
        receivedMeta = meta
        return true
      },
    })

    getStepTypeDefinition("meta-aware-test")!.validate({ id: "x" }, null, {}, { scrolledToEnd: true })
    expect(receivedMeta).toEqual({ scrolledToEnd: true })
  })
})
