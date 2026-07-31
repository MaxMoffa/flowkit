import { describe, expect, it } from "vitest"
import { parseFlow, getStepTypeDefinition, buildReportRows } from "./index"

describe("long-content step", () => {
  it("defaults requireScrollToEnd to false and is excluded from the summary", () => {
    const flow = parseFlow({
      id: "lc-demo",
      title: "LC demo",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "terms", type: "long-content", title: "Termini", content: "Lorem ipsum" },
        { id: "end", type: "confirmation" },
      ],
    })
    expect((flow.steps[1] as unknown as { requireScrollToEnd: boolean }).requireScrollToEnd).toBe(false)
    expect(buildReportRows(flow, {}).map((r) => r.title)).toEqual([])
  })

  it("is valid regardless of meta when requireScrollToEnd is unset/false", () => {
    const def = getStepTypeDefinition("long-content")!
    const step = { id: "x", type: "long-content", content: "hi", requireScrollToEnd: false }
    expect(def.validate(step, null, {}, {})).toBe(true)
    expect(def.validate(step, null, {}, { scrolledToEnd: false })).toBe(true)
  })

  it("blocks until meta.scrolledToEnd is true when requireScrollToEnd is set", () => {
    const def = getStepTypeDefinition("long-content")!
    const step = { id: "x", type: "long-content", content: "hi", requireScrollToEnd: true }
    expect(def.validate(step, null, {}, {})).toBe(false)
    expect(def.validate(step, null, {}, { scrolledToEnd: false })).toBe(false)
    expect(def.validate(step, null, {}, { scrolledToEnd: true })).toBe(true)
  })
})
