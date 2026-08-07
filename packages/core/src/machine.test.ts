import { describe, expect, it } from "vitest"
import { z } from "zod"
import {
  parseFlow,
  type Flow,
  applyBranch,
  canGoBack,
  canGoNext,
  createFlowState,
  goToStep,
  isStepValid,
  next,
  prev,
  registerStepType,
  resolveBranch,
  returnToStep,
  setAnswer,
  setStepMeta,
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
    let state = { index: 2, answers: {}, meta: {}, history: ["welcome", "mood"] }
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
    let state = { index: flow.steps.length - 1, answers: {}, meta: {}, history: ["welcome", "mood", "notes"] }
    state = next(flow, state)
    expect(state.index).toBe(flow.steps.length - 1)
  })
})

describe("meta-aware validation", () => {
  registerStepType({
    type: "meta-gated-test",
    schema: z.object({ id: z.string(), type: z.literal("meta-gated-test") }),
    validate: (_step, _value, _answers, meta) => meta?.unlocked === true,
  })

  function makeMetaGatedFlow(): Flow {
    return parseFlow({
      id: "meta-demo",
      title: "Meta demo",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "gate", type: "meta-gated-test" },
        { id: "end", type: "confirmation" },
      ],
    })
  }

  it("blocks canGoNext/next until the step's meta says unlocked", () => {
    const flow = makeMetaGatedFlow()
    let state = next(flow, createFlowState()) // -> gate
    expect(canGoNext(flow, state)).toBe(false)
    state = next(flow, state)
    expect(state.index).toBe(1)

    state = setStepMeta(state, "gate", { unlocked: true })
    expect(canGoNext(flow, state)).toBe(true)
    state = next(flow, state)
    expect(state.index).toBe(2)
  })
})

describe("disableBack", () => {
  function makeForwardOnlyFlow(): Flow {
    return parseFlow({ ...rawFlow, disableBack: true })
  }

  it("canGoBack is false whenever disableBack is set, even mid-flow", () => {
    const flow = makeForwardOnlyFlow()
    expect(canGoBack(flow, { index: 1, answers: {}, meta: {}, history: ["welcome"] })).toBe(false)
    expect(canGoBack(flow, { index: 0, answers: {}, meta: {}, history: [] })).toBe(false)
  })

  it("canGoBack is true mid-flow on a normal flow", () => {
    const flow = makeFlow()
    expect(canGoBack(flow, { index: 1, answers: {}, meta: {}, history: ["welcome"] })).toBe(true)
    expect(canGoBack(flow, { index: 0, answers: {}, meta: {}, history: [] })).toBe(false)
  })

  it("prev is a no-op when disableBack is set, even mid-flow", () => {
    const flow = makeForwardOnlyFlow()
    const state = prev(flow, { index: 1, answers: {}, meta: {}, history: ["welcome"] })
    expect(state.index).toBe(1)
  })
})

describe("goToStep", () => {
  it("jumps to the step matching the given id, leaving answers untouched", () => {
    const flow = makeFlow()
    const state = { index: 0, answers: { mood: "4" }, meta: {}, history: [] }
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
    const state = { index: 1, answers: {}, meta: {}, history: ["welcome"] }
    const jumped = goToStep(flow, state, "mood")
    expect(jumped.index).toBe(1)
  })
})

describe("returnToStep", () => {
  it("undoes a goToStep round trip without leaving a duplicate history entry", () => {
    const flow = makeFlow()
    const state = { index: 2, answers: {}, meta: {}, history: ["welcome", "mood"] }
    const jumped = goToStep(flow, state, "mood")
    expect(jumped.history).toEqual(["welcome", "mood", "notes"])

    const back = returnToStep(flow, jumped, "notes")
    expect(back.index).toBe(2)
    expect(back.history).toEqual(["welcome", "mood"])
    // Back from there goes one real step further, instead of landing on "notes" again.
    expect(flow.steps[prev(flow, back).index]!.id).toBe("mood")
  })

  it("leaves history alone when the target isn't the entry the jump pushed", () => {
    const flow = makeFlow()
    const state = { index: 1, answers: {}, meta: {}, history: ["welcome"] }
    const back = returnToStep(flow, state, "notes")
    expect(back.index).toBe(2)
    expect(back.history).toEqual(["welcome"])
  })

  it("throws for an unknown step id", () => {
    const flow = makeFlow()
    expect(() => returnToStep(flow, createFlowState(), "does-not-exist")).toThrow(/no step with id/)
  })
})

describe("branching", () => {
  function makeBranchFlow(): Flow {
    return parseFlow({
      id: "branch-demo",
      title: "Branch demo",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "age", type: "text", required: false },
        {
          id: "router",
          type: "branch",
          rules: [{ when: { key: "age", op: "gte", value: 18 }, goTo: "adult-only" }],
          fallback: "minor-only",
        },
        { id: "adult-only", type: "text", required: false },
        { id: "minor-only", type: "text", required: false },
        { id: "end", type: "confirmation" },
      ],
    })
  }

  it("resolveBranch returns the first matching rule's target", () => {
    const flow = makeBranchFlow()
    const state = { index: 2, answers: { age: 21 }, meta: {}, history: ["welcome", "age"] }
    expect(resolveBranch(flow, state)).toBe("adult-only")
  })

  it("resolveBranch falls back when no rule matches", () => {
    const flow = makeBranchFlow()
    const state = { index: 2, answers: { age: 10 }, meta: {}, history: ["welcome", "age"] }
    expect(resolveBranch(flow, state)).toBe("minor-only")
  })

  it("applyBranch jumps to the target without pushing the branch step onto history", () => {
    const flow = makeBranchFlow()
    const state = { index: 2, answers: { age: 21 }, meta: {}, history: ["welcome", "age"] }
    const jumped = applyBranch(flow, state, resolveBranch(flow, state))
    expect(jumped.index).toBe(3)
    expect(jumped.history).toEqual(["welcome", "age"])
  })

  it("resolveBranch follows a chain of branches through to the first renderable step", () => {
    const flow = parseFlow({
      id: "chained",
      title: "Chained",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "age", type: "text", required: false },
        { id: "r1", type: "branch", rules: [{ when: { key: "age", op: "truthy" }, goTo: "r2" }], fallback: "b" },
        { id: "r2", type: "branch", rules: [], fallback: "c" },
        { id: "b", type: "text", required: false },
        { id: "c", type: "text", required: false },
        { id: "end", type: "confirmation" },
      ],
    })
    const state = { index: 2, answers: { age: "21" }, meta: {}, history: ["welcome", "age"] }
    // Not "r2": a caller can land on the returned id in a single jump.
    expect(resolveBranch(flow, state)).toBe("c")
  })

  it("resolveBranch escapes a cyclic branch config instead of looping forever", () => {
    const flow = parseFlow({
      id: "cyclic",
      title: "Cyclic",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "r1", type: "branch", rules: [], fallback: "r2" },
        { id: "r2", type: "branch", rules: [], fallback: "r1" },
        { id: "b", type: "text", required: false },
        { id: "end", type: "confirmation" },
      ],
    })
    const state = { index: 1, answers: {}, meta: {}, history: ["welcome"] }
    expect(resolveBranch(flow, state)).toBe("b")
  })

  it("resolveBranch ignores a target id that doesn't exist instead of dead-ending on it", () => {
    const flow = parseFlow({
      id: "typo",
      title: "Typo",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "age", type: "text", required: false },
        { id: "r1", type: "branch", rules: [{ when: { key: "age", op: "truthy" }, goTo: "typo-id" }], fallback: "b" },
        { id: "b", type: "text", required: false },
        { id: "end", type: "confirmation" },
      ],
    })
    const state = { index: 2, answers: { age: "21" }, meta: {}, history: ["welcome", "age"] }
    expect(resolveBranch(flow, state)).toBe("b")
    expect(() => applyBranch(flow, state, resolveBranch(flow, state))).not.toThrow()
  })

  it("Back after a branch returns to the step before the branch, not the untaken side", () => {
    const flow = makeBranchFlow()
    let state = createFlowState()
    state = next(flow, state) // welcome -> age
    state = setAnswer(state, flow.steps[1]!, 21)
    state = next(flow, state) // age -> router
    state = applyBranch(flow, state, resolveBranch(flow, state)) // router -> adult-only (skips minor-only)
    expect(flow.steps[state.index]!.id).toBe("adult-only")

    state = prev(flow, state)
    expect(flow.steps[state.index]!.id).toBe("age")
  })
})
