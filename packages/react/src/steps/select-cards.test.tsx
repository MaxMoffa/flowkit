import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import type { AnswerValue, Flow, SelectCardsStep } from "@flowkit-io/core"
import "@flowkit-io/core"
import { SelectCardsStepView } from "./select-cards"

const flow: Flow = { id: "t", title: "t", locale: "it", steps: [], disableBack: false, timezone: "UTC" }

function baseStep(options: SelectCardsStep["options"]): SelectCardsStep {
  return {
    id: "flavors",
    type: "select-cards",
    required: true,
    multiple: false,
    options,
  } as unknown as SelectCardsStep
}

function renderStep(step: SelectCardsStep) {
  return render(
    <SelectCardsStepView
      step={step}
      value={null as AnswerValue}
      onChange={() => {}}
      flow={flow}
      answers={{}}
      meta={{}}
      onMetaChange={() => {}}
    />,
  )
}

describe("SelectCardsStepView: option color", () => {
  it("applies the color to the whole card (not just a swatch)", () => {
    const { container } = renderStep(baseStep([{ value: "a", label: "Option A", color: "#46A171" }]))
    const card = container.querySelector(".fk-card") as HTMLElement | null
    expect(card).not.toBeNull()
    expect(card?.classList.contains("fk-option-colored")).toBe(true)
    expect(card?.style.getPropertyValue("--fk-option-color")).toBe("#46A171")
    expect(container.querySelector(".fk-option-swatch")).toBeNull()
  })

  it("still renders description as before (unaffected by the new color field)", () => {
    const { getByText } = renderStep(baseStep([{ value: "a", label: "Option A", description: "desc" }]))
    expect(getByText("desc")).not.toBeNull()
  })

  it("renders unchanged (no color class/variable) when color is absent", () => {
    const { container } = renderStep(baseStep([{ value: "a", label: "Option A" }]))
    const card = container.querySelector(".fk-card") as HTMLElement | null
    expect(card?.classList.contains("fk-option-colored")).toBe(false)
    expect(card?.style.getPropertyValue("--fk-option-color")).toBe("")
    expect(container.querySelector(".fk-option-swatch")).toBeNull()
  })
})
