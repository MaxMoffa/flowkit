import { afterEach, describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { parseFlow } from "@flowkit-io/core"
import { FlowRunner } from "./flow-runner"
import "./steps/builtins"

const nav = navigator as unknown as { vibrate?: (pattern: number | number[]) => boolean }

afterEach(() => {
  delete nav.vibrate
})

function makeFlow() {
  return parseFlow({
    id: "haptics",
    title: "Haptics",
    steps: [
      { id: "welcome", type: "intro", cta: "Inizia" },
      { id: "name", type: "text", key: "name", required: true, placeholder: "Nome" },
      { id: "summary", type: "review", title: "Riepilogo", submitLabel: "Invia" },
      { id: "end", type: "confirmation", title: "Fatto" },
    ],
  })
}

describe("FlowRunner haptics", () => {
  it("vibrates on advance / blocked / back by default", () => {
    const vibrate = vi.fn(() => true)
    nav.vibrate = vibrate

    render(<FlowRunner flow={makeFlow()} />)

    fireEvent.click(screen.getByText("Inizia")) // intro -> name (advance)
    expect(vibrate).toHaveBeenLastCalledWith(10)

    // Enter in the (empty, required) input tries to advance and is blocked.
    fireEvent.keyDown(screen.getByPlaceholderText("Nome"), { key: "Enter" })
    expect(vibrate).toHaveBeenLastCalledWith([28])

    fireEvent.change(screen.getByPlaceholderText("Nome"), { target: { value: "Ada" } })
    fireEvent.click(screen.getByText("Continua")) // -> review (advance)
    expect(vibrate).toHaveBeenLastCalledWith(10)

    fireEvent.click(screen.getByLabelText("Indietro")) // back
    expect(vibrate).toHaveBeenLastCalledWith(8)
  })

  it("uses the double pattern for the review submit", () => {
    const vibrate = vi.fn(() => true)
    nav.vibrate = vibrate
    render(<FlowRunner flow={makeFlow()} onSubmit={vi.fn()} />)

    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.change(screen.getByPlaceholderText("Nome"), { target: { value: "Ada" } })
    fireEvent.click(screen.getByText("Continua")) // -> review
    fireEvent.click(screen.getByText("Invia")) // submit
    expect(vibrate).toHaveBeenLastCalledWith([14, 10, 14])
  })

  it("never vibrates with haptics={false}", () => {
    const vibrate = vi.fn(() => true)
    nav.vibrate = vibrate
    render(<FlowRunner flow={makeFlow()} haptics={false} />)

    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.click(screen.getByText("Continua"))
    expect(vibrate).not.toHaveBeenCalled()
  })
})
