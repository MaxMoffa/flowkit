import { describe, expect, it } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { parseFlow } from "@flowkit-io/core"
import { FlowRunner } from "./flow-runner"
import "./steps/builtins"

const flow = parseFlow({
  id: "smart-fill-test",
  title: "Test",
  steps: [
    { id: "welcome", type: "intro", cta: "Inizia" },
    { id: "nome", type: "text" },
    { id: "cognome", type: "text" },
    {
      id: "sesso",
      type: "radio",
      options: [
        { value: "M", label: "Maschio" },
        { value: "F", label: "Femmina" },
      ],
    },
    { id: "dob", type: "date-time", mode: "date" },
    {
      id: "luogo",
      type: "select-cards",
      options: [{ value: "H501", label: "Roma" }],
    },
    {
      id: "codice-fiscale",
      type: "text",
      addons: [
        {
          type: "smartFill",
          generator: "codiceFiscale",
          sourceFields: {
            nome: "nome",
            cognome: "cognome",
            dataNascita: "dob",
            luogoNascita: "luogo",
            sesso: "sesso",
          },
        },
      ],
    },
    { id: "end", type: "confirmation" },
  ],
})

function fillText(value: string) {
  const input = screen.getByRole("textbox")
  fireEvent.change(input, { target: { value } })
}

function clickContinue() {
  fireEvent.click(screen.getByRole("button", { name: "Continua" }))
}

function clickBack() {
  const backButtons = screen.getAllByRole("button", { name: /Indietro/ })
  fireEvent.click(backButtons[0]!)
}

describe("FlowRunner + smartFill add-on: survives real navigation", () => {
  it("keeps a manual override after navigating back to change a source answer, then forward again", () => {
    render(<FlowRunner flow={flow} />)

    fireEvent.click(screen.getByRole("button", { name: "Inizia" }))
    fillText("Mario")
    clickContinue()
    fillText("Rossi")
    clickContinue()
    fireEvent.click(screen.getByLabelText("Maschio"))
    clickContinue()
    fireEvent.change(document.querySelector('input[type="date"]') as HTMLInputElement, {
      target: { value: "1980-01-01" },
    })
    clickContinue()
    fireEvent.click(screen.getByRole("button", { name: "Roma" }))
    clickContinue()

    const cfInput = screen.getByRole("textbox") as HTMLInputElement
    expect(cfInput.value).toBe("RSSMRA80A01H501U")

    fireEvent.change(cfInput, { target: { value: "CUSTOM1234567890" } })
    expect(cfInput.value).toBe("CUSTOM1234567890")

    clickBack() // -> luogo
    clickBack() // -> dob
    const dobInput = document.querySelector('input[type="date"]') as HTMLInputElement
    fireEvent.change(dobInput, { target: { value: "1990-05-05" } })
    clickContinue() // -> luogo
    clickContinue() // -> codice-fiscale

    const cfInputAgain = screen.getByRole("textbox") as HTMLInputElement
    expect(cfInputAgain.value).toBe("CUSTOM1234567890")
  })
})
