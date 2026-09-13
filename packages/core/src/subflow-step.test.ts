import { describe, expect, it } from "vitest"
import {
  parseFlow,
  getStepTypeDefinition,
  getSubflowProgress,
  initialSubflowNav,
  isSubflowDone,
  resolveSubflowIndex,
  subflowNext,
  subflowPrev,
  type SubflowStep,
  type Step,
} from "./index"

function subflow(overrides: Record<string, unknown> = {}): SubflowStep {
  const def = getStepTypeDefinition("subflow")!
  return def.schema.parse({
    id: "sf",
    type: "subflow",
    steps: [
      { id: "a", type: "text" },
      { id: "b", type: "text" },
    ],
    ...overrides,
  }) as SubflowStep
}

describe("subflow step: requiredChildren / validate", () => {
  it("unset: legacy .every over each child's own required flag", () => {
    const def = getStepTypeDefinition("subflow")!
    const step = subflow()
    expect(def.validate(step, {}, {})).toBe(false)
    expect(def.validate(step, { a: "x", b: "y" }, {})).toBe(true)
  })

  it("unset: a child with required:false doesn't block", () => {
    const def = getStepTypeDefinition("subflow")!
    const step = subflow({
      steps: [
        { id: "a", type: "text", required: false },
        { id: "b", type: "text" },
      ],
    })
    expect(def.validate(step, { b: "y" }, {})).toBe(true)
  })

  it('mode "any": one of the listed children suffices', () => {
    const def = getStepTypeDefinition("subflow")!
    const step = subflow({ requiredChildren: { mode: "any", ids: ["a", "b"] } })
    expect(def.validate(step, {}, {})).toBe(false)
    expect(def.validate(step, { a: "x" }, {})).toBe(true)
  })

  it('mode "none": always valid regardless of answers', () => {
    const def = getStepTypeDefinition("subflow")!
    const step = subflow({ requiredChildren: { mode: "none" } })
    expect(def.validate(step, {}, {})).toBe(true)
  })

  it('a nested "branch" child never satisfies "any" mode on its own', () => {
    const def = getStepTypeDefinition("subflow")!
    const step = subflow({
      steps: [
        { id: "a", type: "text" },
        { id: "route", type: "branch", rules: [] },
      ],
      requiredChildren: { mode: "any" },
    })
    // Without the logic-role exclusion, branch's own validate (() => true) would make
    // this pass even with no real answer at all.
    expect(def.validate(step, {}, {})).toBe(false)
    expect(def.validate(step, { a: "x" }, {})).toBe(true)
  })

  it("a skipped nested group child is excluded, not vacuously valid, in \"any\" mode", () => {
    const def = getStepTypeDefinition("subflow")!
    const step = subflow({
      steps: [
        { id: "a", type: "text" },
        { id: "grp", type: "group", when: { key: "flag", op: "truthy" }, steps: [{ id: "c", type: "text" }] },
      ],
      requiredChildren: { mode: "any" },
    })
    expect(def.validate(step, {}, { flag: false })).toBe(false)
    expect(def.validate(step, { a: "x" }, { flag: false })).toBe(true)
  })
})

describe("subflow step: internal navigation", () => {
  it("resolveSubflowIndex skips a nested branch child", () => {
    const step = subflow({
      steps: [
        { id: "a", type: "text" },
        { id: "route", type: "branch", rules: [], fallback: "b" },
        { id: "b", type: "text" },
      ],
    })
    expect(resolveSubflowIndex(step, { index: 1, history: [] }, {})).toBe(2)
  })

  it("resolveSubflowIndex skips a skipped-group child", () => {
    const step = subflow({
      steps: [
        { id: "a", type: "text" },
        { id: "grp", type: "group", when: { key: "flag", op: "truthy" }, steps: [{ id: "c", type: "text" }] },
        { id: "b", type: "text" },
      ],
    })
    expect(resolveSubflowIndex(step, { index: 1, history: [] }, { flag: false })).toBe(2)
  })

  it("subflowNext doesn't advance past an invalid current child", () => {
    const step = subflow()
    const nav = subflowNext(step, initialSubflowNav, {}, {})
    expect(nav).toEqual(initialSubflowNav)
  })

  it("subflowNext advances and records history once the current child is valid", () => {
    const step = subflow()
    const nav = subflowNext(step, initialSubflowNav, {}, { a: "hi" })
    expect(nav).toEqual({ index: 1, history: [0] })
  })

  it("subflowPrev undoes the last subflowNext", () => {
    const step = subflow()
    let nav = subflowNext(step, initialSubflowNav, {}, { a: "hi" })
    nav = subflowPrev(nav)
    expect(nav).toEqual(initialSubflowNav)
  })

  it("subflowPrev is a no-op at the very first child", () => {
    expect(subflowPrev(initialSubflowNav)).toEqual(initialSubflowNav)
  })

  it("isSubflowDone is true only once nav has moved past the last child", () => {
    const step = subflow()
    let nav = initialSubflowNav
    expect(isSubflowDone(step, nav, {})).toBe(false)
    nav = subflowNext(step, nav, {}, { a: "x" })
    expect(isSubflowDone(step, nav, {})).toBe(false)
    nav = subflowNext(step, nav, {}, { a: "x", b: "y" })
    expect(isSubflowDone(step, nav, {})).toBe(true)
  })

  it("getSubflowProgress reports total/currentIndex over the resolved (branch-aware) path", () => {
    const step = subflow({
      steps: [
        { id: "a", type: "text" },
        { id: "route", type: "branch", rules: [], fallback: "b" },
        { id: "b", type: "text" },
        { id: "c", type: "text" },
      ],
    })
    expect(getSubflowProgress(step, { index: 0, history: [] }, {})).toEqual({ currentIndex: 0, total: 3 })
    expect(getSubflowProgress(step, { index: 1, history: [0] }, {})).toEqual({ currentIndex: 1, total: 3 })
  })
})

describe("subflow step: recursive parsing via parseFlow", () => {
  const baseFlow = {
    id: "flow",
    title: "Flow",
    steps: [{ id: "welcome", type: "intro" }, { id: "end", type: "confirmation" }],
  }

  it("parses nested arbitrary children: group, branch, and another subflow", () => {
    const flow = parseFlow({
      ...baseFlow,
      steps: [
        { id: "welcome", type: "intro" },
        {
          id: "sf",
          type: "subflow",
          steps: [
            { id: "name", type: "text" },
            { id: "grp", type: "group", steps: [{ id: "nick", type: "text" }] },
            {
              id: "inner-sf",
              type: "subflow",
              steps: [{ id: "deep", type: "text" }],
            },
          ],
        },
        { id: "end", type: "confirmation" },
      ],
    })
    const sf = flow.steps[1] as unknown as SubflowStep
    expect(sf.steps).toHaveLength(3)
    const innerSf = sf.steps[2] as unknown as SubflowStep
    expect(innerSf.type).toBe("subflow")
    expect(innerSf.steps[0]!.id).toBe("deep")
  })

  it("resolveStepKeys resolves keys recursively into a subflow's children", () => {
    const flow = parseFlow({
      ...baseFlow,
      steps: [
        { id: "welcome", type: "intro" },
        { id: "sf", type: "subflow", steps: [{ id: "child-a", type: "text", title: "Nome" }] },
        { id: "end", type: "confirmation" },
      ],
    })
    const sf = flow.steps[1] as unknown as SubflowStep
    expect((sf.steps[0] as Step & { key?: string }).key).toBe("nome")
  })

  it("rejects a duplicate key between a subflow child and a top-level step", () => {
    expect(() =>
      parseFlow({
        ...baseFlow,
        steps: [
          { id: "welcome", type: "intro" },
          { id: "name", type: "text", key: "dup" },
          { id: "sf", type: "subflow", steps: [{ id: "child", type: "text", key: "dup" }] },
          { id: "end", type: "confirmation" },
        ],
      }),
    ).toThrow(/duplicate step key "dup"/)
  })
})
