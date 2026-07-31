import { describe, expect, it } from "vitest"
import {
  parseFlow,
  type Flow,
  canGoBack,
  canGoNext,
  createFlowState,
  goToStep,
  isStepValid,
  next,
  prev,
  setAnswer,
} from "./index"

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
    state = setAnswer(state, flow.steps[1]!, "4")
    expect(canGoNext(flow, state)).toBe(true)
    state = next(flow, state) // -> notes
    expect(state.index).toBe(2)
  })

  it("optional steps do not block navigation", () => {
    const flow = makeFlow()
    let state = { index: 2, answers: {}, meta: {} }
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
    let state = { index: flow.steps.length - 1, answers: {}, meta: {} }
    state = next(flow, state)
    expect(state.index).toBe(flow.steps.length - 1)
  })
})

describe("disableBack", () => {
  function makeForwardOnlyFlow(): Flow {
    return parseFlow({ ...rawFlow, disableBack: true })
  }

  it("canGoBack is false whenever disableBack is set, even mid-flow", () => {
    const flow = makeForwardOnlyFlow()
    expect(canGoBack(flow, { index: 1, answers: {}, meta: {} })).toBe(false)
    expect(canGoBack(flow, { index: 0, answers: {}, meta: {} })).toBe(false)
  })

  it("canGoBack is true mid-flow on a normal flow", () => {
    const flow = makeFlow()
    expect(canGoBack(flow, { index: 1, answers: {}, meta: {} })).toBe(true)
    expect(canGoBack(flow, { index: 0, answers: {}, meta: {} })).toBe(false)
  })

  it("prev is a no-op when disableBack is set, even mid-flow", () => {
    const flow = makeForwardOnlyFlow()
    const state = prev(flow, { index: 1, answers: {}, meta: {} })
    expect(state.index).toBe(1)
  })
})

describe("goToStep", () => {
  it("jumps to the step matching the given id, leaving answers untouched", () => {
    const flow = makeFlow()
    const state = { index: 0, answers: { mood: "4" }, meta: {} }
    const jumped = goToStep(flow, state, "notes")
    expect(jumped.index).toBe(2)
    expect(jumped.answers).toEqual({ mood: "4" })
  })

  it("throws for an unknown step id", () => {
    const flow = makeFlow()
    const state = createFlowState()
    expect(() => goToStep(flow, state, "does-not-exist")).toThrow(/no step with id/)
  })

  it("jumping to the current step's own id is a no-op index-wise", () => {
    const flow = makeFlow()
    const state = { index: 1, answers: {}, meta: {} }
    const jumped = goToStep(flow, state, "mood")
    expect(jumped.index).toBe(1)
  })
})
