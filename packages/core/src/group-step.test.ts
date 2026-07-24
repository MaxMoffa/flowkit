import { describe, expect, it } from "vitest"
import { getStepTypeDefinition } from "./registry"
import "./builtins"
import "./group-step"

function group(overrides: Record<string, unknown> = {}) {
  const def = getStepTypeDefinition("group")!
  return def.schema.parse({
    id: "g",
    type: "group",
    steps: [
      { id: "a", type: "text" },
      { id: "b", type: "text" },
    ],
    ...overrides,
  })
}

describe("group step requiredChildren", () => {
  it("unset: legacy .every over each child's own required flag", () => {
    const def = getStepTypeDefinition("group")!
    const step = group()
    expect(def.validate(step, {}, {})).toBe(false)
    expect(def.validate(step, { a: "x", b: "y" }, {})).toBe(true)
  })

  it("unset: a child with required:false doesn't block", () => {
    const def = getStepTypeDefinition("group")!
    const step = group({
      steps: [
        { id: "a", type: "text", required: false },
        { id: "b", type: "text" },
      ],
    })
    expect(def.validate(step, { b: "y" }, {})).toBe(true)
  })

  it('mode "all" with subset ids: only listed children gate', () => {
    const def = getStepTypeDefinition("group")!
    const step = group({ requiredChildren: { mode: "all", ids: ["a"] } })
    expect(def.validate(step, {}, {})).toBe(false)
    expect(def.validate(step, { a: "x" }, {})).toBe(true)
  })

  it('mode "any" with subset ids: one of the listed children suffices', () => {
    const def = getStepTypeDefinition("group")!
    const step = group({ requiredChildren: { mode: "any", ids: ["a", "b"] } })
    expect(def.validate(step, {}, {})).toBe(false)
    expect(def.validate(step, { a: "x" }, {})).toBe(true)
    expect(def.validate(step, { b: "y" }, {})).toBe(true)
  })

  it('mode "none": always valid regardless of answers', () => {
    const def = getStepTypeDefinition("group")!
    const step = group({ requiredChildren: { mode: "none" } })
    expect(def.validate(step, {}, {})).toBe(true)
  })
})
