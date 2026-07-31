import { describe, expect, it } from "vitest"
import { parseFlow, isStepValid, stepImageSchema, slugify } from "./index"

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

describe("Flow.disableBack", () => {
  it("defaults to false", () => {
    const flow = parseFlow(baseFlow)
    expect(flow.disableBack).toBe(false)
  })

  it("accepts an explicit true", () => {
    const flow = parseFlow({ ...baseFlow, disableBack: true })
    expect(flow.disableBack).toBe(true)
  })
})

describe("checkbox step", () => {
  const step = { id: "consent", type: "checkbox" as const, label: "Accetto", required: true }

  it("blocks when the value is not true", () => {
    expect(isStepValid(parseFlow({ ...baseFlow, steps: [baseFlow.steps[0], step, baseFlow.steps[2]] }).steps[1]!, { consent: false })).toBe(false)
    expect(isStepValid(parseFlow({ ...baseFlow, steps: [baseFlow.steps[0], step, baseFlow.steps[2]] }).steps[1]!, {})).toBe(false)
  })

  it("passes once the value is true", () => {
    const flow = parseFlow({ ...baseFlow, steps: [baseFlow.steps[0], step, baseFlow.steps[2]] })
    expect(isStepValid(flow.steps[1]!, { consent: true })).toBe(true)
  })

  it("passes regardless of value when required:false", () => {
    const flow = parseFlow({
      ...baseFlow,
      steps: [baseFlow.steps[0], { ...step, required: false }, baseFlow.steps[2]],
    })
    expect(isStepValid(flow.steps[1]!, { consent: false })).toBe(true)
  })
})

describe("text step pattern", () => {
  const pattern = "^[0-9]{5}$"

  it("blocks a value that doesn't match the pattern", () => {
    const flow = parseFlow({
      ...baseFlow,
      steps: [baseFlow.steps[0], { id: "zip", type: "text", pattern }, baseFlow.steps[2]],
    })
    expect(isStepValid(flow.steps[1]!, { zip: "abc" })).toBe(false)
  })

  it("passes a value that matches the pattern", () => {
    const flow = parseFlow({
      ...baseFlow,
      steps: [baseFlow.steps[0], { id: "zip", type: "text", pattern }, baseFlow.steps[2]],
    })
    expect(isStepValid(flow.steps[1]!, { zip: "12345" })).toBe(true)
  })

  it("still applies the email variant check when both are set", () => {
    const flow = parseFlow({
      ...baseFlow,
      steps: [
        baseFlow.steps[0],
        { id: "biz-email", type: "text", variant: "email", pattern: "^.+@biz\\.com$" },
        baseFlow.steps[2],
      ],
    })
    const step = flow.steps[1]!
    expect(isStepValid(step, { biz_email: "not-an-email" })).toBe(false)
    expect(isStepValid(step, { biz_email: "a@other.com" })).toBe(false)
    expect(isStepValid(step, { biz_email: "a@biz.com" })).toBe(true)
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

describe("stepImageSchema", () => {
  it.each([
    { kind: "emoji", value: "🎉" },
    { kind: "icon", value: "<svg></svg>" },
    { kind: "image", value: "https://example.com/a.png" },
  ])("accepts kind $kind", (image) => {
    expect(stepImageSchema.safeParse(image).success).toBe(true)
  })

  it("rejects an unknown kind", () => {
    expect(stepImageSchema.safeParse({ kind: "photo", value: "x" }).success).toBe(false)
  })

  it("rejects an empty value", () => {
    expect(stepImageSchema.safeParse({ kind: "emoji", value: "" }).success).toBe(false)
  })

  it("is accepted as the `image` field on a step, replacing the old icon/emoji fields", () => {
    const flow = parseFlow({
      ...baseFlow,
      steps: [
        { id: "welcome", type: "intro", image: { kind: "emoji", value: "👋" } },
        { id: "name", type: "text" },
        { id: "end", type: "confirmation" },
      ],
    })
    expect(flow.steps[0]).toMatchObject({ image: { kind: "emoji", value: "👋" } })
  })
})

describe("slugify", () => {
  it("lowercases, replaces non-alphanumerics with underscore, trims/collapses", () => {
    expect(slugify("Come ti senti?")).toBe("come_ti_senti")
    expect(slugify("  Multi   Space  ")).toBe("multi_space")
    expect(slugify("Già-così_ok!!")).toBe("gi_cos_ok")
  })

  it("falls back to a non-empty slug when the input has no alphanumerics", () => {
    expect(slugify("???")).toBe("step")
  })
})

describe("resolveStepKeys (via parseFlow)", () => {
  it("uses an explicit key when set, unchanged", () => {
    const flow = parseFlow({
      ...baseFlow,
      steps: [
        { id: "welcome", type: "intro" },
        { id: "name", type: "text", title: "Nome", key: "custom_key" },
        { id: "end", type: "confirmation" },
      ],
    })
    expect((flow.steps[1] as { key?: string }).key).toBe("custom_key")
  })

  it("falls back to a slug of the title when key is unset", () => {
    const flow = parseFlow({
      ...baseFlow,
      steps: [
        { id: "welcome", type: "intro" },
        { id: "name", type: "text", title: "Nome completo" },
        { id: "end", type: "confirmation" },
      ],
    })
    expect((flow.steps[1] as { key?: string }).key).toBe("nome_completo")
  })

  it("falls back to a slug of the id when neither key nor title is set", () => {
    const flow = parseFlow({
      ...baseFlow,
      steps: [
        { id: "welcome", type: "intro" },
        { id: "step-42", type: "text" },
        { id: "end", type: "confirmation" },
      ],
    })
    expect((flow.steps[1] as { key?: string }).key).toBe("step_42")
  })

  it("resolves keys recursively for group children", () => {
    const flow = parseFlow({
      ...baseFlow,
      steps: [
        { id: "welcome", type: "intro" },
        {
          id: "grp",
          type: "group",
          title: "Extra",
          steps: [{ id: "child", type: "text", title: "Nota" }],
        },
        { id: "end", type: "confirmation" },
      ],
    })
    const group = flow.steps[1] as unknown as { steps: { key?: string }[] }
    expect(group.steps[0]!.key).toBe("nota")
  })

  it("throws on a duplicate resolved key between two top-level steps", () => {
    expect(() =>
      parseFlow({
        ...baseFlow,
        steps: [
          { id: "welcome", type: "intro" },
          { id: "a", type: "text", key: "dup" },
          { id: "b", type: "text", key: "dup" },
          { id: "end", type: "confirmation" },
        ],
      }),
    ).toThrow(/duplicate step key "dup"/)
  })

  it("throws on a duplicate resolved key between a top-level step and a nested group child", () => {
    expect(() =>
      parseFlow({
        ...baseFlow,
        steps: [
          { id: "welcome", type: "intro" },
          { id: "outer", type: "text", key: "shared" },
          {
            id: "grp",
            type: "group",
            steps: [{ id: "inner", type: "text", key: "shared" }],
          },
          { id: "end", type: "confirmation" },
        ],
      }),
    ).toThrow(/duplicate step key "shared"/)
  })
})
