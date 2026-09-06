import { describe, expect, it } from "vitest"
import { multiSelectStepSchema } from "./multi-select-step"
import { radioStepSchema } from "./radio-step"
import { chipsStepSchema } from "./chips-step"
import { selectCardsStepSchema } from "./select-cards-step"
import { resolveContentText } from "./i18n"
import type { Flow } from "./schema"

const contentFlow = (content?: Record<string, string>): Flow => ({
  id: "f",
  title: "F",
  locale: "it",
  disableBack: false,
  timezone: "UTC",
  steps: [],
  content,
  schemaVersion: 1,
})

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

  for (const { name, schema } of cases) {
    it(`${name}: accepts a ContentText option label/description ({key, fallback}) and resolves it via flow.content`, () => {
      const step = schema.parse({
        id: "s",
        type: name,
        options: [
          {
            value: "a",
            label: { key: "optionA.label", fallback: "A (default)" },
            description: { key: "optionA.description", fallback: "Info su A (default)" },
          },
        ],
      })
      const option = step.options[0]!
      expect(resolveContentText(contentFlow(), option.label)).toBe("A (default)")
      expect(resolveContentText(contentFlow(), option.description!)).toBe("Info su A (default)")
      expect(
        resolveContentText(contentFlow({ "optionA.label": "A (dizionario)" }), option.label),
      ).toBe("A (dizionario)")
      expect(
        resolveContentText(
          contentFlow({ "optionA.description": "Info su A (dizionario)" }),
          option.description!,
        ),
      ).toBe("Info su A (dizionario)")
    })

    it(`${name}: a literal string label/description still resolves to itself (no regression)`, () => {
      const step = schema.parse({
        id: "s",
        type: name,
        options: [{ value: "a", label: "A", description: "More info about A" }],
      })
      const option = step.options[0]!
      expect(resolveContentText(contentFlow(), option.label)).toBe("A")
      expect(resolveContentText(contentFlow(), option.description!)).toBe("More info about A")
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
