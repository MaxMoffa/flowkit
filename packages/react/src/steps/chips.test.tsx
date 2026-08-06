import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import type { AnswerValue, ChipsStep, Flow } from "@flowkit-io/core"
import "@flowkit-io/core"
import { ChipsStepView } from "./chips"

const flow: Flow = { id: "t", title: "t", locale: "it", steps: [], disableBack: false, timezone: "UTC" }

function baseStep(options: ChipsStep["options"]): ChipsStep {
  return {
    id: "duration",
    type: "chips",
    required: true,
    multiple: false,
    options,
  } as unknown as ChipsStep
}

function renderStep(step: ChipsStep) {
  return render(
    <ChipsStepView
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

describe("ChipsStepView: option description/color", () => {
  it("renders the description under the label when present", () => {
    const { container, getByText } = renderStep(
      baseStep([{ value: "a", label: "Persistente", description: "Dura più di un giorno" }]),
    )
    expect(getByText("Dura più di un giorno")).not.toBeNull()
    expect(container.querySelector(".fk-chip-with-description")).not.toBeNull()
  })

  it("applies the color as a swatch background", () => {
    const { container } = renderStep(baseStep([{ value: "a", label: "Persistente", color: "#D5803B" }]))
    const swatch = container.querySelector(".fk-option-swatch") as HTMLElement | null
    expect(swatch).not.toBeNull()
    expect(swatch?.style.backgroundColor).toBe("rgb(213, 128, 59)")
  })

  it("renders unchanged (plain pill) when both are absent", () => {
    const { container } = renderStep(baseStep([{ value: "a", label: "Persistente" }]))
    expect(container.querySelector(".fk-option-swatch")).toBeNull()
    expect(container.querySelector(".fk-chip-description")).toBeNull()
    expect(container.querySelector(".fk-chip-with-description")).toBeNull()
  })
})
