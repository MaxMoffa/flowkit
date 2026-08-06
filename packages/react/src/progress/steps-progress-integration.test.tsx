import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { parseFlow } from "@flowkit-io/core"
import { notionClean } from "@flowkit-io/themes"
import { FlowRunner } from "../flow-runner"
import "../steps/builtins"
import "./builtins"

function makeTheme(progressVariant: string) {
  return {
    ...notionClean,
    light: {
      ...notionClean.light,
      layout: { ...notionClean.light.layout, progressVariant },
    },
    dark: {
      ...notionClean.dark,
      layout: { ...notionClean.dark.layout, progressVariant },
    },
  }
}

function makeFlow() {
  return parseFlow({
    id: "steps-progress-integration",
    title: "Test",
    steps: [
      { id: "welcome", type: "intro", cta: "Inizia" },
      { id: "a", type: "text", title: "Database", subtitle: "Scegli la fonte", required: false },
      { id: "b", type: "text", title: "Contenuto", subtitle: "Rivedi gli step generati", required: false },
      { id: "c", type: "text", title: "Dettagli", subtitle: "Nome e aspetto", required: false },
      { id: "end", type: "confirmation" },
    ],
  })
}

describe("FlowRunner + steps progress variant", () => {
  it("passes every resolved step's title/subtitle to the registered 'steps' component", () => {
    const { container } = render(<FlowRunner flow={makeFlow()} theme={makeTheme("steps")} initialStep="a" />)
    const items = container.querySelectorAll(".fk-progress-step")
    expect(items).toHaveLength(3)
    expect(items[0]!.querySelector(".fk-progress-step-title")?.textContent).toBe("Database")
    expect(items[0]!.className).toContain("fk-progress-step--active")
    expect(items[1]!.querySelector(".fk-progress-step-title")?.textContent).toBe("Contenuto")
    expect(items[2]!.querySelector(".fk-progress-step-title")?.textContent).toBe("Dettagli")
  })

  it("advances the active circle as the user moves through steps", () => {
    const { container } = render(<FlowRunner flow={makeFlow()} theme={makeTheme("steps")} initialStep="b" />)
    const items = container.querySelectorAll(".fk-progress-step")
    expect(items[0]!.className).toContain("fk-progress-step--completed")
    expect(items[1]!.className).toContain("fk-progress-step--active")
    expect(items[2]!.className).toContain("fk-progress-step--upcoming")
  })

  it("leaves the bar variant unaffected (backward compat)", () => {
    const { container } = render(<FlowRunner flow={makeFlow()} theme={makeTheme("bar")} initialStep="a" />)
    expect(container.querySelector(".fk-progress-track")).not.toBeNull()
    expect(container.querySelector(".fk-progress-steps")).toBeNull()
  })

  it("leaves the dots variant unaffected (backward compat)", () => {
    const { container } = render(<FlowRunner flow={makeFlow()} theme={makeTheme("dots")} initialStep="a" />)
    expect(container.querySelector(".fk-progress-dots")).not.toBeNull()
    expect(container.querySelector(".fk-progress-steps")).toBeNull()
  })
})
