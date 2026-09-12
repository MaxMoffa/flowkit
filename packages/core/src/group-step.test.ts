import { describe, expect, it } from "vitest"
import { getStepTypeDefinition } from "./registry"
import { isGroupSkipped } from "./group-step"
import type { Step } from "./schema"
import "./text-step"
import "./group-step"

function group(overrides: Record<string, unknown> = {}): Step {
  const def = getStepTypeDefinition("group")!
  return def.schema.parse({
    id: "g",
    type: "group",
    steps: [
      { id: "a", type: "text" },
      { id: "b", type: "text" },
    ],
    ...overrides,
  }) as Step
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

describe("group step when (skip-if-false)", () => {
  it("unset when: isGroupSkipped is always false, whatever the answers", () => {
    const step = group()
    expect(isGroupSkipped(step, {})).toBe(false)
    expect(isGroupSkipped(step, { anything: "x" })).toBe(false)
  })

  it("when true: not skipped", () => {
    const step = group({ when: { key: "show", op: "truthy" } })
    expect(isGroupSkipped(step, { show: true })).toBe(false)
  })

  it("when false: skipped", () => {
    const step = group({ when: { key: "show", op: "truthy" } })
    expect(isGroupSkipped(step, { show: false })).toBe(true)
    expect(isGroupSkipped(step, {})).toBe(true)
  })

  it("a non-group step is never skipped by isGroupSkipped", () => {
    const textStep = { id: "t", type: "text" as const, required: true } as unknown as Step
    expect(isGroupSkipped(textStep, {})).toBe(false)
  })

  it("legacy validate (no requiredChildren): a skipped nested group child doesn't gate, even though it'd otherwise be required", () => {
    const def = getStepTypeDefinition("group")!
    const step = group({
      steps: [
        { id: "a", type: "text" },
        {
          id: "nested",
          type: "group",
          when: { key: "show_nested", op: "truthy" },
          steps: [{ id: "c", type: "text" }],
        },
      ],
    })
    // "nested" is skipped (show_nested falsy) so only "a" gates, even unanswered:
    expect(def.validate(step, {}, { show_nested: false })).toBe(false)
    expect(def.validate(step, { a: "x" }, { show_nested: false })).toBe(true)
  })

  it('requiredChildren mode "any": a skipped nested group child can\'t satisfy the requirement on its own', () => {
    const def = getStepTypeDefinition("group")!
    const step = group({
      requiredChildren: { mode: "any", ids: ["a", "nested"] },
      steps: [
        { id: "a", type: "text" },
        {
          id: "nested",
          type: "group",
          when: { key: "show_nested", op: "truthy" },
          steps: [{ id: "c", type: "text" }],
        },
      ],
    })
    // "nested" is skipped: even though isChildValid would trivially be reached for it,
    // it must be excluded from the "any" candidates, not counted as a free pass.
    expect(def.validate(step, {}, { show_nested: false })).toBe(false)
    expect(def.validate(step, { a: "x" }, { show_nested: false })).toBe(true)
  })

  it("nesting a group inside a group's steps[] parses without error", () => {
    expect(() =>
      group({
        steps: [{ id: "inner", type: "group", steps: [{ id: "deep", type: "text" }] }],
      }),
    ).not.toThrow()
  })
})
