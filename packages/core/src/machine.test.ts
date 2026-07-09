import { describe, expect, it } from "vitest"
import { parseFlow, type Flow } from "./schema"
import { canGoNext, createFlowState, isStepValid, next, prev, setAnswer } from "./machine"

const rawFlow = {
  id: "demo",
  title: "Demo",
  steps: [
    { id: "welcome", type: "intro", title: "Ciao" },
    { id: "mood", type: "faces" },
    { id: "notes", type: "text", required: false },
    { id: "end", type: "confirmation" },
  ],
}

function makeFlow(): Flow {
  return parseFlow(rawFlow)
}

describe("schema", () => {
  it("parses a valid flow", () => {
    expect(() => makeFlow()).not.toThrow()
  })

  it("rejects a flow with unknown step type", () => {
    expect(() =>
      parseFlow({ id: "x", title: "X", steps: [{ id: "a", type: "nope" }] }),
    ).toThrow()
  })
})

describe("machine navigation", () => {
  it("starts at index 0", () => {
    const state = createFlowState()
    expect(state.index).toBe(0)
  })

  it("does not advance past an invalid required step", () => {
    const flow = makeFlow()
    let state = createFlowState()
    state = next(flow, state) // intro -> mood
    expect(state.index).toBe(1)
    state = next(flow, state) // mood requires an answer, should stay
    expect(state.index).toBe(1)
  })

  it("advances once the current step is answered", () => {
    const flow = makeFlow()
    let state = createFlowState()
    state = next(flow, state) // -> mood
    state = setAnswer(state, "mood", "4")
    expect(canGoNext(flow, state)).toBe(true)
    state = next(flow, state) // -> notes
    expect(state.index).toBe(2)
  })

  it("optional steps do not block navigation", () => {
    const flow = makeFlow()
    let state = { index: 2, answers: {} }
    expect(isStepValid(flow.steps[2]!, state.answers)).toBe(true)
    state = next(flow, state)
    expect(state.index).toBe(3)
  })

  it("prev does not go below 0", () => {
    const flow = makeFlow()
    const state = prev(flow, createFlowState())
    expect(state.index).toBe(0)
  })

  it("next does not go past the last step", () => {
    const flow = makeFlow()
    let state = { index: flow.steps.length - 1, answers: {} }
    state = next(flow, state)
    expect(state.index).toBe(flow.steps.length - 1)
  })
})
