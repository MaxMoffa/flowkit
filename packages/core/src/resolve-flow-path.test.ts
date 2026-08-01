import { describe, expect, it } from "vitest"
import {
  applyBranch,
  createFlowState,
  getProgressInfo,
  goToStep,
  next,
  parseFlow,
  resolveBranch,
  resolveFlowPath,
  setAnswer,
  type Flow,
} from "./index"

function stepByIdInFlow(flow: Flow, id: string) {
  return flow.steps.find((s) => s.id === id)!
}

describe("resolveFlowPath: linear flow (no branches)", () => {
  const flow = parseFlow({
    id: "linear",
    title: "Linear",
    steps: [
      { id: "welcome", type: "intro" },
      { id: "a", type: "text", required: false },
      { id: "b", type: "text", required: false },
      { id: "end", type: "confirmation" },
    ],
  })

  it("is fully determinate and includes every non-intro/confirmation step", () => {
    const state = createFlowState()
    const path = resolveFlowPath(flow, state)
    expect(path.determinate).toBe(true)
    expect(path.stepIds).toEqual(["a", "b"])
  })

  it("getProgressInfo reports a real total, not flow.steps.length", () => {
    const state = createFlowState()
    const info = getProgressInfo(flow, state)
    expect(info.total).toBe(2)
    expect(info.currentIndex).toBe(0)
    expect(info.pct).toBe(0.5)
  })
})

describe("resolveFlowPath: resolved branch shortens the path", () => {
  function makeFlow(): Flow {
    return parseFlow({
      id: "branch",
      title: "Branch",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "has-pet", type: "radio", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
        {
          id: "router",
          type: "branch",
          rules: [{ when: { key: "has_pet", op: "eq", value: "no" }, goTo: "review" }],
        },
        { id: "pet-name", type: "text", required: false },
        { id: "review", type: "text", title: "Review", required: false },
        { id: "end", type: "confirmation" },
      ],
    })
  }

  it("counts the full 3-step path (branch unresolved yet, but not on the walked prefix) as indeterminate before has-pet is answered", () => {
    const flow = makeFlow()
    const state = createFlowState()
    const path = resolveFlowPath(flow, state)
    // "has-pet" (index 1) hasn't been answered yet (state.index is 0, at "welcome"),
    // and the branch (index 2) depends on it — not yet resolvable.
    expect(path.determinate).toBe(false)
    expect(path.stepIds).toEqual(["has-pet"])
  })

  it("resolves the branch and skips pet-name once has-pet=no is answered and reached", () => {
    const flow = makeFlow()
    let state = createFlowState()
    state = next(flow, state) // welcome -> has-pet
    state = setAnswer(state, stepByIdInFlow(flow, "has-pet"), "no")

    const path = resolveFlowPath(flow, state)
    expect(path.determinate).toBe(true)
    expect(path.stepIds).toEqual(["has-pet", "review"])
    expect(path.stepIds).not.toContain("pet-name")

    const info = getProgressInfo(flow, state)
    expect(info.total).toBe(2)
    expect(info.currentIndex).toBe(0)
  })

  it("takes the fallback (natural next) path when has-pet=yes", () => {
    const flow = makeFlow()
    let state = createFlowState()
    state = next(flow, state)
    state = setAnswer(state, stepByIdInFlow(flow, "has-pet"), "yes")

    const path = resolveFlowPath(flow, state)
    expect(path.determinate).toBe(true)
    expect(path.stepIds).toEqual(["has-pet", "pet-name", "review"])
  })

  it("recomputes after Back + changing the answer that drove the branch", () => {
    const flow = makeFlow()
    let state = createFlowState()
    state = next(flow, state)
    state = setAnswer(state, stepByIdInFlow(flow, "has-pet"), "yes")
    expect(resolveFlowPath(flow, state).stepIds).toContain("pet-name")

    // Same step (no real "back" needed since has-pet is still state.index=1): change
    // the answer directly, as a user editing it via a review row would.
    state = setAnswer(state, stepByIdInFlow(flow, "has-pet"), "no")
    const path = resolveFlowPath(flow, state)
    expect(path.stepIds).not.toContain("pet-name")
    expect(path.stepIds).toEqual(["has-pet", "review"])
  })
})

describe("resolveFlowPath: nested/unresolvable branches stay indeterminate", () => {
  it("a branch whose dependency step hasn't been reached yet makes the path indeterminate", () => {
    const flow = parseFlow({
      id: "nested",
      title: "Nested",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "q1", type: "radio", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }] },
        {
          id: "router1",
          type: "branch",
          rules: [{ when: { key: "q1", op: "eq", value: "a" }, goTo: "q2" }],
          fallback: "q3",
        },
        { id: "q2", type: "radio", required: false, options: [{ value: "x", label: "X" }] },
        {
          id: "router2",
          type: "branch",
          rules: [{ when: { key: "q2", op: "eq", value: "x" }, goTo: "end" }],
          fallback: "q3",
        },
        { id: "q3", type: "text", required: false },
        { id: "end", type: "confirmation" },
      ],
    })

    // At the very start, nothing is answered yet: router1 already can't resolve.
    const state = createFlowState()
    const path = resolveFlowPath(flow, state)
    expect(path.determinate).toBe(false)
    expect(path.stepIds).toEqual(["q1"])
  })

  it("resolves progressively as the user actually answers each gating question", () => {
    const flow = parseFlow({
      id: "nested2",
      title: "Nested2",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "q1", type: "radio", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }] },
        {
          id: "router1",
          type: "branch",
          rules: [{ when: { key: "q1", op: "eq", value: "a" }, goTo: "q2" }],
          fallback: "q3",
        },
        { id: "q2", type: "radio", required: false, options: [{ value: "x", label: "X" }] },
        {
          id: "router2",
          type: "branch",
          rules: [{ when: { key: "q2", op: "eq", value: "x" }, goTo: "end" }],
          fallback: "q3",
        },
        { id: "q3", type: "text", required: false },
        { id: "end", type: "confirmation" },
      ],
    })

    let state = createFlowState()
    state = next(flow, state) // welcome -> q1
    state = setAnswer(state, stepByIdInFlow(flow, "q1"), "a")
    // router1 resolves to q2, but router2 (gated on q2, not yet answered/reached) can't.
    let path = resolveFlowPath(flow, state)
    expect(path.determinate).toBe(false)
    expect(path.stepIds).toEqual(["q1", "q2"])

    state = next(flow, state) // q1 -> router1
    state = applyBranch(flow, state, resolveBranch(flow, state)) // router1 -> q2
    state = setAnswer(state, stepByIdInFlow(flow, "q2"), "x")
    path = resolveFlowPath(flow, state)
    expect(path.determinate).toBe(true)
    expect(path.stepIds).toEqual(["q1", "q2"])
  })
})

describe("resolveFlowPath: goToStep (review jump) still resolves", () => {
  it("stays determinate when jumping via goToStep after answers are already known", () => {
    const flow = parseFlow({
      id: "jump",
      title: "Jump",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "a", type: "text", required: false },
        { id: "b", type: "text", required: false },
        { id: "end", type: "confirmation" },
      ],
    })
    let state = createFlowState()
    state = next(flow, state)
    state = setAnswer(state, stepByIdInFlow(flow, "a"), "hi")
    state = next(flow, state)
    state = setAnswer(state, stepByIdInFlow(flow, "b"), "there")
    state = goToStep(flow, state, "a")

    const path = resolveFlowPath(flow, state)
    expect(path.determinate).toBe(true)
    expect(path.stepIds).toEqual(["a", "b"])
  })
})
