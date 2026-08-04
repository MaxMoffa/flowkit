import { describe, expect, it } from "vitest"
import {
  computeInitialFlowState,
  createFlowState,
  filterValidAnswers,
  isStepReachable,
  parseFlow,
  type Flow,
} from "./index"

function linearFlow(): Flow {
  return parseFlow({
    id: "linear",
    title: "Linear",
    steps: [
      { id: "welcome", type: "intro" },
      { id: "a", type: "text", required: false },
      { id: "b", type: "text", required: true },
      { id: "end", type: "confirmation" },
    ],
  })
}

function branchFlow(): Flow {
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

/** Two branches gated on separate questions (mirrors resolve-flow-path.test.ts's
 *  "nested2" flow): "q2" is only ever reached when router1 routes there, which needs
 *  q1="a" — with no/other q1 answer, router1 falls back straight to q3, skipping q2
 *  entirely, unlike branchFlow's "review" (reachable via both branches, since they
 *  converge before it). Used to test a genuinely branch-gated-unreachable target. */
function nestedBranchFlow(): Flow {
  return parseFlow({
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
      { id: "q2", type: "text", required: false },
      { id: "q3", type: "text", required: false },
      { id: "end", type: "confirmation" },
    ],
  })
}

describe("isStepReachable", () => {
  it("the intro step is reachable only trivially at the start", () => {
    const flow = linearFlow()
    expect(isStepReachable(flow, createFlowState(), "welcome")).toBe(true)
  })

  it("a regular step is reachable when it's on the resolved path", () => {
    const flow = linearFlow()
    const state = { ...createFlowState(), index: flow.steps.length - 1 }
    expect(isStepReachable(flow, state, "a")).toBe(true)
    expect(isStepReachable(flow, state, "b")).toBe(true)
  })

  it("the confirmation step is reachable once the whole path is determinate", () => {
    const flow = linearFlow()
    const state = { ...createFlowState(), index: flow.steps.length - 1 }
    expect(isStepReachable(flow, state, "end")).toBe(true)
  })

  it("an unknown id is never reachable", () => {
    const flow = linearFlow()
    expect(isStepReachable(flow, createFlowState(), "nope")).toBe(false)
  })

  it("a step past an unresolved branch is not reachable", () => {
    const flow = branchFlow()
    expect(isStepReachable(flow, createFlowState(), "review")).toBe(false)
  })

  it("a step becomes reachable once the branch-driving answer is known", () => {
    const flow = branchFlow()
    const state = { ...createFlowState(), answers: { has_pet: "no" }, index: flow.steps.length - 1 }
    expect(isStepReachable(flow, state, "review")).toBe(true)
    expect(isStepReachable(flow, state, "pet-name")).toBe(false)
  })
})

describe("filterValidAnswers", () => {
  it("drops keys that don't match any step", () => {
    const flow = linearFlow()
    const result = filterValidAnswers(flow, { a: "hi", mystery: "???" })
    expect(result).toEqual({ a: "hi" })
  })

  it("drops values that fail the step's own validation rule", () => {
    const flow = linearFlow()
    // "b" is required (text step): an empty string fails validation.
    const result = filterValidAnswers(flow, { a: "hi", b: "" })
    expect(result).toEqual({ a: "hi" })
  })

  it("keeps valid values for known steps", () => {
    const flow = linearFlow()
    const result = filterValidAnswers(flow, { a: "hi", b: "hello" })
    expect(result).toEqual({ a: "hi", b: "hello" })
  })
})

describe("computeInitialFlowState", () => {
  it("with no options, behaves exactly like createFlowState", () => {
    const flow = linearFlow()
    expect(computeInitialFlowState(flow)).toEqual(createFlowState())
  })

  it("initialStepId lands directly on a reachable step, with history backfilled", () => {
    const flow = linearFlow()
    const state = computeInitialFlowState(flow, { initialStepId: "b" })
    expect(state.index).toBe(2)
    expect(state.history).toEqual(["a"])
  })

  it("initialStepId targeting the confirmation step backfills the full resolved path", () => {
    const flow = linearFlow()
    const state = computeInitialFlowState(flow, {
      initialStepId: "end",
      initialAnswers: { b: "hello" },
    })
    expect(state.index).toBe(3)
    expect(state.history).toEqual(["a", "b"])
  })

  it("falls back to index 0 for a nonexistent step id, without throwing", () => {
    const flow = linearFlow()
    expect(() => computeInitialFlowState(flow, { initialStepId: "nope" })).not.toThrow()
    const state = computeInitialFlowState(flow, { initialStepId: "nope" })
    expect(state.index).toBe(0)
    expect(state.history).toEqual([])
  })

  it("falls back to index 0 when the target isn't reachable given the preloaded answers", () => {
    const flow = nestedBranchFlow()
    // q1 unanswered: router1 falls back to q3, so "q2" is never reached.
    const state = computeInitialFlowState(flow, { initialStepId: "q2" })
    expect(state.index).toBe(0)
  })

  it("initialAnswers can unlock a branch-gated initialStepId", () => {
    const flow = branchFlow()
    const state = computeInitialFlowState(flow, {
      initialStepId: "review",
      initialAnswers: { has_pet: "no" },
    })
    expect(state.index).toBe(flow.steps.findIndex((s) => s.id === "review"))
    expect(state.answers).toEqual({ has_pet: "no" })
  })

  it("initialAnswers alone seeds answers without moving the index", () => {
    const flow = linearFlow()
    const state = computeInitialFlowState(flow, { initialAnswers: { a: "hi", mystery: "x" } })
    expect(state.index).toBe(0)
    expect(state.answers).toEqual({ a: "hi" })
  })
})
