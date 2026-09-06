import { useState } from "react"
import { describe, expect, it } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import type { AnswerValue, Flow, MultiSelectStep } from "@flowkit-io/core"
import "@flowkit-io/core"
import { MultiSelectStepView } from "./multi-select"

const flow: Flow = { id: "t", title: "t", locale: "it", steps: [], disableBack: false, timezone: "UTC", schemaVersion: 1 }

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

function StatefulMultiSelect({ step }: { step: MultiSelectStep }) {
  const [value, setValue] = useState<AnswerValue>(null)
  return (
    <MultiSelectStepView
      step={step}
      value={value}
      onChange={setValue}
      flow={flow}
      answers={{}}
      meta={{}}
      onMetaChange={() => {}}
    />
  )
}

describe("MultiSelectStepView: otherOption", () => {
  const withOther = (): MultiSelectStep =>
    ({ ...baseStep([{ value: "a", label: "A" }]), otherOption: { label: "Altro" } }) as MultiSelectStep

  it("is absent by default", () => {
    const { container } = renderStep(baseStep([{ value: "a", label: "A" }]))
    expect(container.querySelector(".fk-list-other")).toBeNull()
  })

  it("reveals a text input on check and stores what the user types in the value array", () => {
    const { container } = render(<StatefulMultiSelect step={withOther()} />)
    const other = container.querySelector(".fk-list-other")!
    expect(other).not.toBeNull()
    expect(other.querySelector(".fk-list-other-input")).toBeNull()

    fireEvent.click(other.querySelector("input[type=checkbox]")!)
    const input = container.querySelector(".fk-list-other-input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "Kiwi" } })
    expect((container.querySelector(".fk-list-other-input") as HTMLInputElement).value).toBe("Kiwi")

    // also select a real option — the free text survives alongside it
    fireEvent.click(container.querySelector(".fk-list-item input[type=checkbox]")!)
    fireEvent.click(other.querySelector("input[type=checkbox]")!) // uncheck "other"
    expect(container.querySelector(".fk-list-other-input")).toBeNull()
  })
})
