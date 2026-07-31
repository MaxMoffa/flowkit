import { describe, expect, it } from "vitest"
import { parseFlow, evaluateCondition, type Condition } from "./index"

describe("evaluateCondition", () => {
  const answers = { age: 21, name: "Ada", tags: ["a", "b"], subscribed: true, empty: "" }

  it.each([
    [{ key: "name", op: "eq" as const, value: "Ada" }, true],
    [{ key: "name", op: "eq" as const, value: "Bob" }, false],
    [{ key: "name", op: "neq" as const, value: "Bob" }, true],
    [{ key: "age", op: "gt" as const, value: 18 }, true],
    [{ key: "age", op: "gt" as const, value: 21 }, false],
    [{ key: "age", op: "gte" as const, value: 21 }, true],
    [{ key: "age", op: "lt" as const, value: 30 }, true],
    [{ key: "age", op: "lte" as const, value: 21 }, true],
    [{ key: "name", op: "in" as const, value: ["Ada", "Bob"] }, true],
    [{ key: "name", op: "notIn" as const, value: ["Ada", "Bob"] }, false],
    [{ key: "tags", op: "contains" as const, value: "b" }, true],
    [{ key: "tags", op: "contains" as const, value: "z" }, false],
    [{ key: "subscribed", op: "truthy" as const }, true],
    [{ key: "empty", op: "falsy" as const }, true],
    [{ key: "missing", op: "truthy" as const }, false],
  ])("%j -> %s", (condition, expected) => {
    expect(evaluateCondition(condition as Condition, answers)).toBe(expected)
  })

  it("numeric comparisons are false when either side isn't a number", () => {
    expect(evaluateCondition({ key: "name", op: "gt", value: 18 }, answers)).toBe(false)
    expect(evaluateCondition({ key: "age", op: "gt", value: "18" }, answers)).toBe(false)
  })

  it("composes with all/any/not", () => {
    const allCond: Condition = {
      all: [
        { key: "age", op: "gte", value: 18 },
        { key: "subscribed", op: "truthy" },
      ],
    }
    expect(evaluateCondition(allCond, answers)).toBe(true)

    const anyCond: Condition = {
      any: [
        { key: "age", op: "lt", value: 10 },
        { key: "name", op: "eq", value: "Ada" },
      ],
    }
    expect(evaluateCondition(anyCond, answers)).toBe(true)

    const notCond: Condition = { not: { key: "age", op: "lt", value: 10 } }
    expect(evaluateCondition(notCond, answers)).toBe(true)
  })
})

describe("branch step schema", () => {
  it("parses within a flow, self-registered role:logic, excluded from summary", () => {
    const flow = parseFlow({
      id: "b",
      title: "B",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "age", type: "text", required: false },
        {
          id: "router",
          type: "branch",
          rules: [{ when: { key: "age", op: "gte", value: 18 }, goTo: "end" }],
        },
        { id: "end", type: "confirmation" },
      ],
    })
    expect(flow.steps[2]).toMatchObject({ type: "branch" })
  })

  it("defaults rules to an empty array when omitted", () => {
    const flow = parseFlow({
      id: "b2",
      title: "B2",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "router", type: "branch" },
        { id: "end", type: "confirmation" },
      ],
    })
    expect((flow.steps[1] as unknown as { rules: unknown[] }).rules).toEqual([])
  })
})
