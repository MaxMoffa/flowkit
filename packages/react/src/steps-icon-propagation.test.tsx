import { describe, expect, it } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { parseFlow } from "@flowkit-io/core"
import { FlowRunner } from "./flow-runner"
import "./steps/builtins"

/** Regression coverage for the step-icon propagation fix: before this, `step.image`
 *  only ever rendered for `intro`/`info` (via `IntroLikeView`) — every other step type
 *  silently dropped it. `step-image.test.tsx`/`step-title.test.tsx` cover the shared
 *  components in isolation; this exercises a couple of real, non-intro step types
 *  end-to-end through `FlowRunner`, which is where the original bug actually lived. */
function makeFlow() {
  return parseFlow({
    id: "icon-propagation",
    title: "Test",
    steps: [
      { id: "welcome", type: "intro", cta: "Inizia" },
      {
        id: "cards",
        type: "select-cards",
        title: "Scegli",
        image: { kind: "emoji", value: "🎯" },
        options: [{ value: "x", label: "X" }],
      },
      { id: "scale", type: "scale", title: "Valuta", min: 1, max: 5 },
      { id: "end", type: "confirmation" },
    ],
  })
}

describe("step icon propagation (non-intro step types)", () => {
  it("renders the icon inline next to a select-cards step's title", () => {
    render(<FlowRunner flow={makeFlow()} />)
    fireEvent.click(screen.getByText("Inizia")) // welcome -> cards

    const title = document.querySelector("h2.fk-title")!
    expect(title.querySelector(".fk-title-icon")?.textContent).toBe("🎯")
    expect(title.textContent).toBe("🎯Scegli")
  })

  it("renders no icon markup (no empty space) on a step with no image set", () => {
    render(<FlowRunner flow={makeFlow()} />)
    fireEvent.click(screen.getByText("Inizia")) // welcome -> cards
    fireEvent.click(screen.getByText("X")) // select the only option, so "Continua" is enabled
    fireEvent.click(screen.getByText("Continua")) // cards -> scale

    const title = document.querySelector("h2.fk-title")!
    expect(title.textContent).toBe("Valuta")
    expect(title.querySelector(".fk-title-icon")).toBeNull()
  })
})
