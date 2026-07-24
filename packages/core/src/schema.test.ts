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
})
