import { describe, expect, it } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { parseFlow } from "@flowkit-io/core"
import { FlowRunner } from "./flow-runner"
import "./steps/builtins"

/** intro -> a1/a2 (sec-a) -> plain (no section) -> end. */
function makeFlow() {
  return parseFlow({
    id: "section-ui-test",
    title: "Test",
    sections: [{ id: "sec-a", title: "Dati personali", color: "#2783DE", icon: { kind: "emoji", value: "👤" } }],
    steps: [
      { id: "welcome", type: "intro", cta: "Inizia" },
      { id: "a1", type: "text", title: "Nome", required: false, sectionId: "sec-a" },
      { id: "a2", type: "text", title: "Cognome", required: false, sectionId: "sec-a" },
      { id: "plain", type: "text", title: "Altro", required: false },
      { id: "end", type: "confirmation" },
    ],
  })
}

describe("FlowRunner: section primitive (banner + segmented progress)", () => {
  it("shows the section banner on a step that belongs to a section", () => {
    render(<FlowRunner flow={makeFlow()} />)
    fireEvent.click(screen.getByText("Inizia"))
    expect(screen.getByText("Dati personali")).not.toBeNull()
  })

  it("keeps showing the banner across consecutive steps sharing the section", () => {
    render(<FlowRunner flow={makeFlow()} />)
    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.click(screen.getByText("Continua")) // a1 -> a2
    expect(screen.getByText("Dati personali")).not.toBeNull()
  })

  it("hides the banner on a step outside any section", () => {
    render(<FlowRunner flow={makeFlow()} />)
    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.click(screen.getByText("Continua")) // a1 -> a2
    fireEvent.click(screen.getByText("Continua")) // a2 -> plain
    expect(screen.queryByText("Dati personali")).toBeNull()
  })

  it("segments the progress bar by section", () => {
    const { container } = render(<FlowRunner flow={makeFlow()} />)
    fireEvent.click(screen.getByText("Inizia"))
    const segments = container.querySelectorAll(".fk-progress-segment")
    // sec-a (a1+a2) + null (plain) = 2 segments
    expect(segments.length).toBe(2)
  })
})
