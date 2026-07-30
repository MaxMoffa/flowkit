import { describe, expect, it } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import { useState } from "react"
import type { AnswerValue, Answers, TextStep } from "@flowkit-io/core"
import "@flowkit-io/core"
import { TextStepView } from "./text"

const cfStep = {
  id: "codice-fiscale",
  type: "text",
  required: true,
  variant: "text",
  multiline: false,
  addons: [
    {
      type: "smartFill" as const,
      generator: "codiceFiscale",
      sourceFields: {
        nome: "nome",
        cognome: "cognome",
        dataNascita: "dob",
        luogoNascita: "place",
        sesso: "sesso",
      },
    },
  ],
} as unknown as TextStep

function Harness({ initialAnswers }: { initialAnswers: Answers }) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers)
  const [value, setValue] = useState<AnswerValue>(null)
  const [meta, setMeta] = useState<Record<string, unknown>>({})

  return (
    <div>
      <TextStepView
        step={cfStep}
        value={value}
        onChange={setValue}
        flow={{ id: "t", title: "t", locale: "it", steps: [], disableBack: false }}
        answers={answers}
        meta={meta}
        onMetaChange={(patch) => setMeta((m) => ({ ...m, ...patch }))}
      />
      <button
        type="button"
        data-testid="change-source"
        onClick={() => setAnswers((a) => ({ ...a, dob: "1990-05-05" }))}
      >
        change source
      </button>
    </div>
  )
}

describe("TextStepView + smartFill add-on", () => {
  const baseAnswers: Answers = {
    nome: "Mario",
    cognome: "Rossi",
    dob: "1980-01-01",
    place: "H501",
    sesso: "M",
  }

  it("auto-fills the suggested value when the field is empty", () => {
    const { container } = render(<Harness initialAnswers={baseAnswers} />)
    const input = container.querySelector("input") as HTMLInputElement
    expect(input.value).toBe("RSSMRA80A01H501U")
    expect(container.querySelector(".fk-smartfill-hint")).not.toBeNull()
  })

  it("regenerates the suggestion when source answers change, as long as untouched", () => {
    const { container, getByTestId } = render(<Harness initialAnswers={baseAnswers} />)
    const input = container.querySelector("input") as HTMLInputElement
    expect(input.value).toBe("RSSMRA80A01H501U")

    fireEvent.click(getByTestId("change-source"))
    expect(input.value).toBe("RSSMRA90E05H501R")
  })

  it("keeps a manual override even when source answers change afterwards", () => {
    const { container, getByTestId } = render(<Harness initialAnswers={baseAnswers} />)
    const input = container.querySelector("input") as HTMLInputElement
    expect(input.value).toBe("RSSMRA80A01H501U")

    fireEvent.change(input, { target: { value: "CUSTOM1234567890" } })
    expect(input.value).toBe("CUSTOM1234567890")
    expect(container.querySelector(".fk-smartfill-hint")).toBeNull()

    fireEvent.click(getByTestId("change-source"))
    expect(input.value).toBe("CUSTOM1234567890")
  })
})
