import { describe, expect, it } from "vitest"
import { parseFlow } from "./index"

const baseFlow = {
  id: "flow",
  title: "Flow",
  steps: [
    { id: "welcome", type: "intro" },
    { id: "name", type: "text" },
    { id: "end", type: "confirmation" },
  ],
}

describe("parseFlow step order", () => {
  it("accepts a flow starting with intro and ending with confirmation", () => {
    const flow = parseFlow(baseFlow)
    expect(flow.steps).toHaveLength(3)
  })

  it("rejects a flow whose first step is not an intro", () => {
    expect(() =>
      parseFlow({
        ...baseFlow,
        steps: [{ id: "name", type: "text" }, { id: "end", type: "confirmation" }],
      }),
    ).toThrow(/first step .* role "intro"/)
  })

  it("rejects a flow whose last step is not a confirmation", () => {
    expect(() =>
      parseFlow({
        ...baseFlow,
        steps: [{ id: "welcome", type: "intro" }, { id: "name", type: "text" }],
      }),
    ).toThrow(/last step .* role "confirmation"/)
  })

  it("rejects a flow with a confirmation step in the middle", () => {
    expect(() =>
      parseFlow({
        ...baseFlow,
        steps: [
          { id: "welcome", type: "intro" },
          { id: "mid", type: "confirmation" },
          { id: "end", type: "confirmation" },
        ],
      }),
    ).toThrow(/step at index 1 .* role "confirmation"/)
  })

  it("accepts a checkpoint review step at a mid-flow position", () => {
    const flow = parseFlow({
      ...baseFlow,
      steps: [
        { id: "welcome", type: "intro" },
        { id: "midway", type: "review", mode: "checkpoint" },
        { id: "name", type: "text" },
        { id: "final", type: "review" },
        { id: "end", type: "confirmation" },
      ],
    })
    expect(flow.steps).toHaveLength(5)
  })

  it("accepts multiple checkpoint review steps", () => {
    const flow = parseFlow({
      ...baseFlow,
      steps: [
        { id: "welcome", type: "intro" },
        { id: "checkpoint-1", type: "review", mode: "checkpoint" },
        { id: "name", type: "text" },
        { id: "checkpoint-2", type: "review", mode: "checkpoint" },
        { id: "final", type: "review" },
        { id: "end", type: "confirmation" },
      ],
    })
    expect(flow.steps).toHaveLength(6)
  })

  it("rejects a second final-mode review step", () => {
    expect(() =>
      parseFlow({
        ...baseFlow,
        steps: [
          { id: "welcome", type: "intro" },
          { id: "final-1", type: "review" },
          { id: "final-2", type: "review", mode: "final" },
          { id: "end", type: "confirmation" },
        ],
      }),
    ).toThrow(/only one step with role "review" and mode "final" is allowed/)
  })

  it("rejects a final review step that is not second-to-last", () => {
    expect(() =>
      parseFlow({
        ...baseFlow,
        steps: [
          { id: "welcome", type: "intro" },
          { id: "final", type: "review" },
          { id: "name", type: "text" },
          { id: "end", type: "confirmation" },
        ],
      }),
    ).toThrow(/must be the second-to-last step/)
  })
})

describe("base step fields", () => {
  const stepsWithBaseFields = [
    { id: "sig", type: "signature" },
    { id: "grp", type: "group", steps: [{ id: "child", type: "text" }] },
    {
      id: "auth",
      type: "oauth",
      providers: [{ id: "google", clientId: "c", redirectUri: "https://app.test/cb" }],
    },
  ]

  // Every step type accepts the base fields, whatever file its schema lives in.
  // The oauth schema used to omit themeOverride/contentAlign because its base fields
  // were retyped by hand instead of spread from schema.ts.
  it.each(stepsWithBaseFields)("accepts themeOverride and contentAlign on $type", (step) => {
    const flow = parseFlow({
      ...baseFlow,
      steps: [
        { id: "welcome", type: "intro" },
        { ...step, themeOverride: { accent: "#FF0000" }, contentAlign: "center" },
        { id: "end", type: "confirmation" },
      ],
    })
    const parsed = flow.steps[1] as { themeOverride?: Record<string, unknown>; contentAlign?: string }
    expect(parsed.themeOverride).toEqual({ accent: "#FF0000" })
    expect(parsed.contentAlign).toBe("center")
  })
})
