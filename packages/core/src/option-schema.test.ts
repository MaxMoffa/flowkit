import { describe, expect, it } from "vitest"
import { multiSelectStepSchema } from "./multi-select-step"
import { radioStepSchema } from "./radio-step"
import { chipsStepSchema } from "./chips-step"
import { selectCardsStepSchema } from "./select-cards-step"

const cases = [
  { name: "multi-select", schema: multiSelectStepSchema, extra: {} },
  { name: "radio", schema: radioStepSchema, extra: {} },
  { name: "chips", schema: chipsStepSchema, extra: {} },
  { name: "select-cards", schema: selectCardsStepSchema, extra: {} },
] as const

describe("option schema: description/color", () => {
  for (const { name, schema } of cases) {
    it(`${name}: accepts an option with description and color`, () => {
      const step = schema.parse({
        id: "s",
        type: name,
        options: [{ value: "a", label: "A", description: "More info about A", color: "#2783DE" }],
      })
      expect(step.options[0]).toMatchObject({
        value: "a",
        label: "A",
        description: "More info about A",
        color: "#2783DE",
      })
    })

    it(`${name}: accepts an option without description/color (backward compatible)`, () => {
      const step = schema.parse({
        id: "s",
        type: name,
        options: [{ value: "a", label: "A" }],
      })
      expect(step.options[0]?.description).toBeUndefined()
      expect(step.options[0]?.color).toBeUndefined()
    })
  }

  it("select-cards: keeps its own emoji field alongside the shared description/color", () => {
    const step = selectCardsStepSchema.parse({
      id: "s",
      type: "select-cards",
      options: [{ value: "a", label: "A", emoji: "🎉", description: "desc", color: "#46A171" }],
    })
    expect(step.options[0]).toMatchObject({
      value: "a",
      label: "A",
      emoji: "🎉",
      description: "desc",
      color: "#46A171",
    })
  })
})
