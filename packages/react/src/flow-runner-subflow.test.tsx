import { describe, expect, it } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { parseFlow } from "@flowkit-io/core"
import { FlowRunner } from "./flow-runner"
import "./steps/builtins"

/** intro -> before -> [subflow: a, b] -> after -> end. */
function makeFlow() {
  return parseFlow({
    id: "subflow-ui-test",
    title: "Test",
    steps: [
      { id: "welcome", type: "intro", cta: "Inizia" },
      { id: "before", type: "text", title: "Prima", required: false },
      {
        id: "sf",
        type: "subflow",
        steps: [
          { id: "a", type: "text", title: "Nome", required: false },
          { id: "b", type: "text", title: "Cognome", required: false },
        ],
      },
      { id: "after", type: "text", title: "Dopo", required: false },
      { id: "end", type: "confirmation" },
    ],
  })
}

function stepno(container: HTMLElement) {
  return container.querySelector(".fk-stepno")?.textContent
}

describe("FlowRunner: subflow step (local progress, flat answers, transparent nav)", () => {
  it("shows the overall count outside any subflow span", () => {
    const { container } = render(<FlowRunner flow={makeFlow()} />)
    fireEvent.click(screen.getByText("Inizia"))
    expect(screen.getByText("Prima")).not.toBeNull()
    expect(stepno(container)).toBe("1/4")
  })

  it("switches to a local, span-scoped count once inside the subflow", () => {
    const { container } = render(<FlowRunner flow={makeFlow()} />)
    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.click(screen.getByText("Continua")) // before -> a
    expect(screen.getByText("Nome")).not.toBeNull()
    expect(stepno(container)).toBe("1/2")
    fireEvent.click(screen.getByText("Continua")) // a -> b
    expect(screen.getByText("Cognome")).not.toBeNull()
    expect(stepno(container)).toBe("2/2")
  })

  it("reverts to the overall count once past the subflow, using the exact same header/footer chrome throughout", () => {
    const { container } = render(<FlowRunner flow={makeFlow()} />)
    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.click(screen.getByText("Continua")) // before -> a
    fireEvent.click(screen.getByText("Continua")) // a -> b
    fireEvent.click(screen.getByText("Continua")) // b -> after
    expect(screen.getByText("Dopo")).not.toBeNull()
    expect(stepno(container)).toBe("4/4")
  })

  it("merges the subflow children's answers flat into the same single answers object", () => {
    const { container } = render(<FlowRunner flow={makeFlow()} />)
    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.click(screen.getByText("Continua")) // before -> a
    fireEvent.input(container.querySelector("input")!, { target: { value: "Mario" } })
    fireEvent.click(screen.getByText("Continua")) // a -> b
    fireEvent.input(container.querySelector("input")!, { target: { value: "Rossi" } })
    fireEvent.click(screen.getByText("Continua")) // b -> after
    fireEvent.click(screen.getByText("Continua")) // after -> end
    expect(screen.queryByText("Dopo")).toBeNull()
  })

  it("Back at the subflow's first child exits to the step before it, using the normal Back button", () => {
    const { container } = render(<FlowRunner flow={makeFlow()} />)
    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.click(screen.getByText("Continua")) // before -> a
    const backButton = container.querySelector(".fk-back") as HTMLButtonElement
    fireEvent.click(backButton)
    expect(screen.getByText("Prima")).not.toBeNull()
  })
})
