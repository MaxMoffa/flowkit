import { describe, expect, it } from "vitest"
import {
  applyBranch,
  createFlowState,
  getCurrentStepInfo,
  goToStep,
  next,
  parseFlow,
  prev,
  resolveBranch,
  setAnswer,
  setAnswerAndInvalidateDownstream,
  setStepMeta,
  type CurrentStepInfo,
  type Flow,
} from "./index"

function makeBranchFlow(): Flow {
  return parseFlow({
    id: "branch-demo",
    title: "Branch demo",
    steps: [
      { id: "welcome", type: "intro", title: "Benvenuto" },
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

function stepByIdInFlow(flow: Flow, id: string) {
  return flow.steps.find((s) => s.id === id)!
}

describe("getCurrentStepInfo: initial mount", () => {
  it("reports the first (intro) step with direction 'initial' and no previousStep", () => {
    const flow = makeBranchFlow()
    const state = createFlowState()
    const info = getCurrentStepInfo(flow, state, "initial", null)

    expect(info).toMatchObject({ id: "welcome", type: "intro", direction: "initial", previousStep: null })
  })
})

describe("getCurrentStepInfo: forward/back", () => {
  it("advances index and carries the previous step forward on 'next'", () => {
    const flow = makeBranchFlow()
    let state = createFlowState()
    let info = getCurrentStepInfo(flow, state, "initial", null)

    state = next(flow, state) // welcome -> age
    info = getCurrentStepInfo(flow, state, "next", info)

    expect(info.id).toBe("age")
    expect(info.direction).toBe("next")
    expect(info.previousStep).toEqual({ id: "welcome", type: "intro", title: "Benvenuto", index: info.previousStep!.index })
  })

  it("direction 'prev' returns to the earlier step, previousStep pointing at where it came from", () => {
    const flow = makeBranchFlow()
    let state = createFlowState()
    let info = getCurrentStepInfo(flow, state, "initial", null)
    state = next(flow, state) // welcome -> age
    info = getCurrentStepInfo(flow, state, "next", info)
    state = setAnswer(state, stepByIdInFlow(flow, "age"), 21)
    // re-derive info to reflect the answer's effect on total, same step
    info = getCurrentStepInfo(flow, state, "next", info)

    state = next(flow, state) // age -> router (logic) -> resolved by caller below
    state = applyBranch(flow, state, resolveBranch(flow, state)) // -> adult-only
    const onAdult = getCurrentStepInfo(flow, state, "next", info)
    expect(onAdult.id).toBe("adult-only")

    state = prev(flow, state) // adult-only -> age
    const backOnAge = getCurrentStepInfo(flow, state, "prev", onAdult)
    expect(backOnAge.id).toBe("age")
    expect(backOnAge.direction).toBe("prev")
    expect(backOnAge.previousStep!.id).toBe("adult-only")
  })
})

describe("getCurrentStepInfo: direct jump", () => {
  it("direction 'jump' for a goToStep shortcut (e.g. review row)", () => {
    const flow = makeBranchFlow()
    let state = createFlowState()
    state = next(flow, state) // welcome -> age
    state = setAnswer(state, stepByIdInFlow(flow, "age"), 21)
    let info = getCurrentStepInfo(flow, state, "next", null)

    state = goToStep(flow, state, "welcome")
    info = getCurrentStepInfo(flow, state, "jump", info)

    expect(info.id).toBe("welcome")
    expect(info.direction).toBe("jump")
    expect(info.previousStep!.id).toBe("age")
  })
})

describe("getCurrentStepInfo: logic steps are transparent", () => {
  it("a branch step never has to be reported — the caller resolves it and reports only the landed step, previousStep skips straight to the step before the branch", () => {
    const flow = makeBranchFlow()
    let state = createFlowState()
    state = next(flow, state) // welcome -> age
    state = setAnswer(state, stepByIdInFlow(flow, "age"), 21)
    const onAge = getCurrentStepInfo(flow, state, "next", null)

    state = next(flow, state) // age -> router
    expect(stepByIdInFlow(flow, "router").type).toBe("branch")
    // The engine doesn't stop to report "router": resolve + apply it before ever
    // building a CurrentStepInfo for this transition.
    state = applyBranch(flow, state, resolveBranch(flow, state)) // router -> adult-only

    const onAdult = getCurrentStepInfo(flow, state, "next", onAge)
    expect(onAdult.id).toBe("adult-only")
    expect(onAdult.previousStep!.id).toBe("age")
    expect(onAdult.previousStep!.id).not.toBe("router")
  })
})

describe("setAnswerAndInvalidateDownstream: branch-change invalidation", () => {
  it("discards a stale downstream answer once the driving answer routes elsewhere, and recomputes index/total", () => {
    const flow = makeBranchFlow()
    let state = createFlowState()
    state = next(flow, state) // welcome -> age
    state = setAnswer(state, stepByIdInFlow(flow, "age"), 21)
    state = next(flow, state) // age -> router
    state = applyBranch(flow, state, resolveBranch(flow, state)) // -> adult-only
    state = setAnswer(state, stepByIdInFlow(flow, "adult-only"), "foo")
    state = setStepMeta(state, "adult-only", { touched: true })
    // no explicit `key` on the step: it resolves from the id, hyphens collapsed to `_`.
    expect(state.answers["adult_only"]).toBe("foo")

    const onAdult = getCurrentStepInfo(flow, state, "next", null)
    expect(onAdult.total).toBe(3) // ["age", "adult-only", "minor-only"], see resolveFlowPath

    state = prev(flow, state) // adult-only -> age
    const backOnAge = getCurrentStepInfo(flow, state, "prev", onAdult)
    expect(backOnAge.total).toBe(3) // answers.age is still 21 at this point

    const result = setAnswerAndInvalidateDownstream(flow, state, stepByIdInFlow(flow, "age"), 10)
    expect(result.invalidated).toBe(true)
    expect(result.state.answers).not.toHaveProperty("adult_only")
    expect(result.state.meta).not.toHaveProperty("adult-only")
    // "age" itself is untouched.
    expect(result.state.answers.age).toBe(10)

    const branchChangeInfo = getCurrentStepInfo(flow, result.state, "branch-change", backOnAge)
    expect(branchChangeInfo.id).toBe("age") // same step — nothing navigated
    expect(branchChangeInfo.direction).toBe("branch-change")
    expect(branchChangeInfo.total).toBe(2) // ["age", "minor-only"] now that age routes to the fallback
    expect(branchChangeInfo.previousStep!.id).toBe("age")
  })

  it("is a no-op (invalidated: false) when the new value doesn't change anything reachable", () => {
    const flow = makeBranchFlow()
    let state = createFlowState()
    state = next(flow, state) // welcome -> age
    state = setAnswer(state, stepByIdInFlow(flow, "age"), 21)

    const result = setAnswerAndInvalidateDownstream(flow, state, stepByIdInFlow(flow, "age"), 25)
    expect(result.invalidated).toBe(false)
    expect(result.state.answers.age).toBe(25)
  })

  it("does not prune an answer sitting beyond a still-unresolved further branch", () => {
    const flow = parseFlow({
      id: "nested-invalidate",
      title: "Nested invalidate",
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

    // q3 already has a leftover answer from some earlier state (simulated directly —
    // router2 depends on q2, which hasn't been reached again yet from index 0, so the
    // path stays indeterminate past q1/q2 and q3 must be left alone).
    const state: Parameters<typeof setAnswerAndInvalidateDownstream>[1] = {
      index: 0,
      answers: { q3: "leftover" },
      meta: {},
      history: [],
    }

    const result = setAnswerAndInvalidateDownstream(flow, state, stepByIdInFlow(flow, "q1"), "b")
    expect(result.invalidated).toBe(false)
    expect(result.state.answers.q3).toBe("leftover")
  })
})

describe("getCurrentStepInfo: stability", () => {
  it("returns equal id/index/total for the same state regardless of how many times it's called", () => {
    const flow = makeBranchFlow()
    let state = createFlowState()
    state = next(flow, state)
    state = setAnswer(state, stepByIdInFlow(flow, "age"), 21)

    const a: CurrentStepInfo = getCurrentStepInfo(flow, state, "next", null)
    const b: CurrentStepInfo = getCurrentStepInfo(flow, state, "next", null)
    expect(a.id).toBe(b.id)
    expect(a.index).toBe(b.index)
    expect(a.total).toBe(b.total)
  })
})
