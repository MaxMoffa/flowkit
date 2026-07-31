import { describe, expect, it } from "vitest"
import { parseFlow, getStepTypeDefinition, buildReportRows } from "./index"

describe("info step", () => {
  it("can appear anywhere in the flow, repeated, without a role", () => {
    expect(() =>
      parseFlow({
        id: "info-demo",
        title: "Info demo",
        steps: [
          { id: "welcome", type: "intro" },
          { id: "info-1", type: "info", title: "Nota 1" },
          { id: "q1", type: "text" },
          { id: "info-2", type: "info", title: "Nota 2" },
          { id: "end", type: "confirmation" },
        ],
      }),
    ).not.toThrow()
    expect(getStepTypeDefinition("info")?.role).toBeUndefined()
  })

  it("is excluded from the summary and adds no field to the flow", () => {
    const flow = parseFlow({
      id: "info-demo-2",
      title: "Info demo 2",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "info-1", type: "info", title: "Nota" },
        { id: "q1", type: "text", title: "Domanda" },
        { id: "end", type: "confirmation" },
      ],
    })
    const rows = buildReportRows(flow, {})
    expect(rows.map((r) => r.title)).toEqual(["Domanda"])
  })

  it("is always valid (no answer required)", () => {
    const def = getStepTypeDefinition("info")!
    expect(def.validate({ id: "x", type: "info" }, null, {})).toBe(true)
  })
})
