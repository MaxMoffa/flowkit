import { useState } from "react"
import { describe, expect, it } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import type { AnswerValue, Flow, RadioStep } from "@flowkit-io/core"
import "@flowkit-io/core"
import { RadioStepView } from "./radio"

const flow: Flow = { id: "t", title: "t", locale: "it", steps: [], disableBack: false, timezone: "UTC" }

function baseStep(extra: Partial<RadioStep> = {}): RadioStep {
  return {
    id: "channel",
    type: "radio",
    required: true,
    options: [
      { value: "email", label: "Email" },
      { value: "phone", label: "Phone" },
    ],
    ...extra,
  } as unknown as RadioStep
}

function StatefulRadio({ step, initial = null }: { step: RadioStep; initial?: AnswerValue }) {
  const [value, setValue] = useState<AnswerValue>(initial)
  return (
    <RadioStepView
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

describe("RadioStepView: otherOption", () => {
  it("is absent by default", () => {
    const { container } = render(<StatefulRadio step={baseStep()} />)
    expect(container.querySelector(".fk-list-other")).toBeNull()
  })

  it("picking 'Altro' reveals an input and the typed text becomes the value", () => {
    const { container } = render(
      <StatefulRadio step={baseStep({ otherOption: { label: "Altro" } })} />,
    )
    fireEvent.click(container.querySelector(".fk-list-other input[type=radio]")!)
    const input = container.querySelector(".fk-list-other-input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "Pigeon" } })
    expect((container.querySelector(".fk-list-other-input") as HTMLInputElement).value).toBe("Pigeon")

    // picking a real option hides the other input again
    fireEvent.click(container.querySelectorAll(".fk-list-item input[type=radio]")[0]!)
    expect(container.querySelector(".fk-list-other-input")).toBeNull()
  })

  it("resuming with a free value pre-selects 'other' with the text filled in", () => {
    const { container } = render(
      <StatefulRadio step={baseStep({ otherOption: {} })} initial="Carrier pigeon" />,
    )
    const otherRadio = container.querySelector(".fk-list-other input[type=radio]") as HTMLInputElement
    expect(otherRadio.checked).toBe(true)
    expect((container.querySelector(".fk-list-other-input") as HTMLInputElement).value).toBe("Carrier pigeon")
  })
})
