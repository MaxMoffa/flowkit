import { describe, expect, it } from "vitest"
import {
  parseFlow,
  createFlowState,
  next,
  setAnswer,
  getCurrentStep,
  getLocalProgressInfo,
  getProgressInfo,
  type Flow,
  type Step,
} from "./index"

function stepByIdInFlow(flow: Flow, id: string) {
  return flow.steps.find((s) => s.id === id)!
}

describe("subflow step: flattening (parseFlow)", () => {
  it("splices the subflow's children directly into flow.steps, dropping the subflow itself", () => {
    const flow = parseFlow({
      id: "flow",
      title: "Flow",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "sf", type: "subflow", steps: [{ id: "first", type: "text" }, { id: "last", type: "text" }] },
        { id: "end", type: "confirmation" },
      ],
    })
    expect(flow.steps.map((s) => s.id)).toEqual(["welcome", "first", "last", "end"])
    expect(flow.steps.some((s) => (s.type as string) === "subflow")).toBe(false)
  })

  it("records a Flow.subflowSpans entry with the flattened child ids", () => {
    const flow = parseFlow({
      id: "flow",
      title: "Flow",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "sf", type: "subflow", title: "Profilo", steps: [{ id: "first", type: "text" }, { id: "last", type: "text" }] },
        { id: "end", type: "confirmation" },
      ],
    })
    expect(flow.subflowSpans).toEqual([{ id: "sf", title: "Profilo", stepIds: ["first", "last"] }])
  })

  it("a flow with no subflow at all has no subflowSpans", () => {
    const flow = parseFlow({
      id: "flow",
      title: "Flow",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "a", type: "text" },
        { id: "end", type: "confirmation" },
      ],
    })
    expect(flow.subflowSpans).toBeUndefined()
  })

  it("flattens a subflow nested inside another subflow, recursively, into one outer span", () => {
    const flow = parseFlow({
      id: "flow",
      title: "Flow",
      steps: [
        { id: "welcome", type: "intro" },
        {
          id: "outer",
          type: "subflow",
          steps: [
            { id: "a", type: "text" },
            { id: "inner", type: "subflow", steps: [{ id: "b", type: "text" }, { id: "c", type: "text" }] },
            { id: "d", type: "text" },
          ],
        },
        { id: "end", type: "confirmation" },
      ],
    })
    expect(flow.steps.map((s) => s.id)).toEqual(["welcome", "a", "b", "c", "d", "end"])
    expect(flow.subflowSpans).toEqual([
      { id: "inner", title: undefined, stepIds: ["b", "c"] },
      { id: "outer", title: undefined, stepIds: ["a", "b", "c", "d"] },
    ])
  })

  it("recurses into a group's own nested steps too, flattening a subflow inside it", () => {
    const flow = parseFlow({
      id: "flow",
      title: "Flow",
      steps: [
        { id: "welcome", type: "intro" },
        {
          id: "grp",
          type: "group",
          steps: [{ id: "before", type: "text" }, { id: "sf", type: "subflow", steps: [{ id: "inside", type: "text" }] }],
        },
        { id: "end", type: "confirmation" },
      ],
    })
    const grp = flow.steps[1] as unknown as { steps: Step[] }
    expect(grp.steps.map((s) => s.id)).toEqual(["before", "inside"])
  })
})

describe("subflow step: answers merge flat, like ordinary top-level steps", () => {
  function makeFlow(): Flow {
    return parseFlow({
      id: "flow",
      title: "Flow",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "sf", type: "subflow", steps: [{ id: "first", type: "text" }, { id: "last", type: "text" }] },
        { id: "end", type: "confirmation" },
      ],
    })
  }

  it("each flattened child's answer lives directly in the flat answers object", () => {
    const flow = makeFlow()
    let state = createFlowState()
    state = next(flow, state) // welcome -> first
    state = setAnswer(state, stepByIdInFlow(flow, "first"), "Mario")
    state = next(flow, state) // first -> last
    state = setAnswer(state, stepByIdInFlow(flow, "last"), "Rossi")
    expect(state.answers).toEqual({ first: "Mario", last: "Rossi" })
  })

  it("Back at the subflow's first child exits to the step before it in the outer flow", () => {
    const flow = makeFlow()
    let state = createFlowState()
    state = next(flow, state) // welcome -> first
    expect(getCurrentStep(flow, state).id).toBe("first")
  })
})

describe("subflow step: nested branch behaves exactly like a top-level branch", () => {
  function makeFlow(): Flow {
    return parseFlow({
      id: "flow",
      title: "Flow",
      steps: [
        { id: "welcome", type: "intro" },
        {
          id: "sf",
          type: "subflow",
          steps: [
            { id: "has-company", type: "radio", key: "has_company", options: [{ value: "yes", label: "Sì" }, { value: "no", label: "No" }] },
            { id: "route", type: "branch", rules: [{ when: { key: "has_company", op: "eq", value: "no" }, goTo: "after" }] },
            { id: "company-name", type: "text" },
            { id: "after", type: "text", required: false },
          ],
        },
        { id: "end", type: "confirmation" },
      ],
    })
  }

  it("resolveFlowPath skips the branch and company-name when has_company is 'no'", () => {
    const flow = makeFlow()
    const state = { index: 0, history: [], answers: { has_company: "no" }, meta: {} }
    const path = getProgressInfo(flow, state).total
    expect(path).toBe(2) // has-company, after (company-name skipped)
  })
})

describe("getLocalProgressInfo", () => {
  function makeFlow(): Flow {
    return parseFlow({
      id: "flow",
      title: "Flow",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "before", type: "text", required: false },
        { id: "sf", type: "subflow", steps: [{ id: "a", type: "text", required: false }, { id: "b", type: "text", required: false }] },
        { id: "after", type: "text", required: false },
        { id: "end", type: "confirmation" },
      ],
    })
  }

  it("is null for a step outside any subflow span", () => {
    const flow = makeFlow()
    let state = createFlowState()
    state = next(flow, state) // welcome -> before
    expect(getLocalProgressInfo(flow, state)).toBeNull()
  })

  it("reports local position/total while inside the span", () => {
    const flow = makeFlow()
    let state = createFlowState()
    state = next(flow, state) // welcome -> before
    state = next(flow, state) // before -> a
    expect(getLocalProgressInfo(flow, state)).toEqual({ currentIndex: 0, total: 2, pct: 0.5 })
    state = next(flow, state) // a -> b
    expect(getLocalProgressInfo(flow, state)).toEqual({ currentIndex: 1, total: 2, pct: 1 })
  })

  it("is null again once past the span", () => {
    const flow = makeFlow()
    let state = createFlowState()
    state = next(flow, state) // welcome -> before
    state = next(flow, state) // before -> a
    state = next(flow, state) // a -> b
    state = next(flow, state) // b -> after
    expect(getCurrentStep(flow, state).id).toBe("after")
    expect(getLocalProgressInfo(flow, state)).toBeNull()
  })

  it("getProgressInfo (overall) keeps counting subflow steps as normal flow steps", () => {
    const flow = makeFlow()
    const state = createFlowState()
    expect(getProgressInfo(flow, state).total).toBe(4) // before, a, b, after
  })
})
