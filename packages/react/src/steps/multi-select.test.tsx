import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import type { AnswerValue, Flow, MultiSelectStep } from "@flowkit-io/core"
import "@flowkit-io/core"
import { MultiSelectStepView } from "./multi-select"

const flow: Flow = { id: "t", title: "t", locale: "it", steps: [], disableBack: false, timezone: "UTC" }

function baseStep(options: MultiSelectStep["options"]): MultiSelectStep {
  return {
    id: "flavors",
    type: "multi-select",
    required: true,
    options,
    min: 0,
  } as unknown as MultiSelectStep
}

function renderStep(step: MultiSelectStep) {
  return render(
    <MultiSelectStepView
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

describe("MultiSelectStepView: option description/color", () => {
  it("renders the description under the label when present", () => {
    const { container, getByText } = renderStep(
      baseStep([{ value: "a", label: "Option A", description: "Extra info about A" }]),
    )
    expect(getByText("Extra info about A")).not.toBeNull()
    expect(container.querySelector(".fk-list-description")).not.toBeNull()
  })

  it("applies the color to the whole row (not just a swatch)", () => {
    const { container } = renderStep(
      baseStep([{ value: "a", label: "Option A", color: "#2783DE" }]),
    )
    const row = container.querySelector(".fk-list-item") as HTMLElement | null
    expect(row).not.toBeNull()
    expect(row?.classList.contains("fk-option-colored")).toBe(true)
    expect(row?.style.getPropertyValue("--fk-option-color")).toBe("#2783DE")
    expect(container.querySelector(".fk-option-swatch")).toBeNull()
  })

  it("renders unchanged (no swatch, no description) when both are absent", () => {
    const { container } = renderStep(baseStep([{ value: "a", label: "Option A" }]))
    expect(container.querySelector(".fk-option-swatch")).toBeNull()
    expect(container.querySelector(".fk-list-description")).toBeNull()
    expect(container.querySelector(".fk-list-text")).toBeNull()
    const label = container.querySelector(".fk-list-label")
    expect(label?.textContent).toBe("Option A")
  })
})
