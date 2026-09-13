import { describe, expect, it } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { parseFlow } from "@flowkit-io/core"
import { FlowRunner } from "./flow-runner"
import "./steps/builtins"

/** intro -> sf (subflow: first-name -> last-name) -> end. */
function makeFlow() {
  return parseFlow({
    id: "subflow-ui-test",
    title: "Test",
    steps: [
      { id: "welcome", type: "intro", cta: "Inizia" },
      {
        id: "sf",
        type: "subflow",
        title: "I tuoi dati",
        steps: [
          { id: "first", type: "text", title: "Nome", required: true },
          { id: "last", type: "text", title: "Cognome", required: true },
        ],
      },
      { id: "end", type: "confirmation" },
    ],
  })
}

describe("FlowRunner: subflow step (nested mini flow)", () => {
  it("renders the subflow's own first child, the outer Continua disabled until it's complete", () => {
    render(<FlowRunner flow={makeFlow()} />)
    fireEvent.click(screen.getByText("Inizia"))
    expect(screen.getByText("Nome")).not.toBeNull()
    // Two "Continua": the subflow's own internal one, and the outer footer's.
    const continues = screen.getAllByText("Continua")
    expect(continues.length).toBe(2)
    const outerContinue = continues[continues.length - 1] as HTMLButtonElement
    expect(outerContinue.disabled).toBe(true)
  })

  it("completing every internal child enables the outer Continua, which then leaves the subflow", () => {
    const { container } = render(<FlowRunner flow={makeFlow()} />)
    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.input(container.querySelector("input")!, { target: { value: "Mario" } })
    fireEvent.click(screen.getAllByText("Continua")[0]!) // internal: first -> last
    fireEvent.input(container.querySelector("input")!, { target: { value: "Rossi" } })
    fireEvent.click(screen.getAllByText("Continua")[0]!) // internal: last -> done

    const outerContinue = screen.getAllByText("Continua")[0] as HTMLButtonElement
    expect(outerContinue.disabled).toBe(false)
    fireEvent.click(outerContinue) // outer: sf -> end
    expect(screen.queryByText("I tuoi dati")).toBeNull()
  })
})
