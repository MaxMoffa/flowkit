import { useState } from "react"
import { describe, expect, it } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import type { AnswerValue, Flow, RadioStep } from "@flowkit-io/core"
import "@flowkit-io/core"
import { RadioStepView } from "./radio"

const flow: Flow = { id: "t", title: "t", locale: "it", steps: [], disableBack: false, timezone: "UTC", schemaVersion: 1 }

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

describe("RadioStepView: ContentText title/subtitle/option label", () => {
  const contentStep = baseStep({
    title: { key: "channel.title", fallback: "Come preferisci essere contattato?" },
    subtitle: { key: "channel.subtitle", fallback: "Scegli un canale" },
    options: [
      { value: "email", label: { key: "channel.email", fallback: "Email (default)" } },
      { value: "phone", label: "Phone" },
    ],
  })

  it("renders each ContentText field's own fallback when flow.content is unset", () => {
    const { container } = render(<StatefulRadio step={contentStep} />)
    expect(container.querySelector(".fk-title")?.textContent).toBe("Come preferisci essere contattato?")
    expect(container.querySelector(".fk-subtitle")?.textContent).toBe("Scegli un canale")
    expect(container.querySelector(".fk-list-label")?.textContent).toBe("Email (default)")
  })

  it("renders the flow.content dictionary value when present, over the fallback", () => {
    const flowWithContent: Flow = {
      ...flow,
      content: {
        "channel.title": "Canale preferito?",
        "channel.subtitle": "Scegli tra le opzioni",
        "channel.email": "Email (dizionario)",
      },
    }
    const { container } = render(
      <RadioStepView
        step={contentStep}
        value={null}
        onChange={() => {}}
        flow={flowWithContent}
        answers={{}}
        meta={{}}
        onMetaChange={() => {}}
      />,
    )
    expect(container.querySelector(".fk-title")?.textContent).toBe("Canale preferito?")
    expect(container.querySelector(".fk-subtitle")?.textContent).toBe("Scegli tra le opzioni")
    expect(container.querySelector(".fk-list-label")?.textContent).toBe("Email (dizionario)")
  })
})
