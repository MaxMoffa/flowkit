import { describe, expect, it } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { parseFlow } from "@flowkit-io/core"
import { FlowRunner } from "./flow-runner"
import "./steps/builtins"

function makeFlow() {
  return parseFlow({
    id: "branch-ui-test",
    title: "Test",
    steps: [
      { id: "welcome", type: "intro", cta: "Inizia" },
      { id: "age", type: "text", required: false, placeholder: "Età" },
      {
        id: "router",
        type: "branch",
        // The "text" step's onChange always yields a string, so this compares strings
        // (not "gte" numeric comparison) — condition-op numeric behavior is already
        // covered by branch-step.test.ts; this test is about the FlowRunner wiring.
        rules: [{ when: { key: "age", op: "eq", value: "21" }, goTo: "adult-step" }],
        fallback: "minor-step",
      },
      { id: "adult-step", type: "text", title: "Contenuto adulti", required: false },
      { id: "minor-step", type: "text", title: "Contenuto minori", required: false },
      { id: "end", type: "confirmation" },
    ],
  })
}

describe("FlowRunner branching", () => {
  it("jumps straight to the matching branch target, never rendering the branch step or the untaken side", () => {
    render(<FlowRunner flow={makeFlow()} />)

    fireEvent.click(screen.getByText("Inizia")) // intro -> age
    fireEvent.change(screen.getByPlaceholderText("Età"), { target: { value: "21" } })
    fireEvent.click(screen.getByText("Continua")) // age -> router -> adult-step (auto-resolved)

    expect(screen.getByText("Contenuto adulti")).not.toBeNull()
    expect(screen.queryByText("Contenuto minori")).toBeNull()
  })

  it("takes the fallback path when no rule matches", () => {
    render(<FlowRunner flow={makeFlow()} />)

    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.change(screen.getByPlaceholderText("Età"), { target: { value: "10" } })
    fireEvent.click(screen.getByText("Continua"))

    expect(screen.getByText("Contenuto minori")).not.toBeNull()
    expect(screen.queryByText("Contenuto adulti")).toBeNull()
  })

  it("Back from the landed branch target returns to the step before the branch, not the branch step", () => {
    render(<FlowRunner flow={makeFlow()} />)

    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.change(screen.getByPlaceholderText("Età"), { target: { value: "21" } })
    fireEvent.click(screen.getByText("Continua"))
    expect(screen.getByText("Contenuto adulti")).not.toBeNull()

    fireEvent.click(screen.getByLabelText("Indietro"))
    expect(screen.getByPlaceholderText("Età")).not.toBeNull()
  })
})
