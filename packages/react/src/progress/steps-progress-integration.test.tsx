import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { parseFlow } from "@flowkit-io/core"
import { warmPaper } from "@flowkit-io/themes"
import { FlowRunner } from "../flow-runner"
import "../steps/builtins"
import "./builtins"

function makeTheme(progressVariant: string) {
  return {
    ...warmPaper,
    light: {
      ...warmPaper.light,
      layout: { ...warmPaper.light.layout, progressVariant },
    },
    dark: {
      ...warmPaper.dark,
      layout: { ...warmPaper.dark.layout, progressVariant },
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

function makeLongFlow() {
  return parseFlow({
    id: "steps-progress-integration-long",
    title: "Test",
    steps: [
      { id: "welcome", type: "intro", cta: "Inizia" },
      ...Array.from({ length: 9 }, (_, i) => ({
        id: `s${i + 1}`,
        type: "text" as const,
        title: `Passo ${i + 1}`,
        subtitle: `Descrizione ${i + 1}`,
        required: false,
      })),
      { id: "end", type: "confirmation" },
    ],
  })
}

describe("FlowRunner + steps progress variant", () => {
  it("renders one numbered circle per resolved step, active one highlighted", () => {
    const { container } = render(<FlowRunner flow={makeFlow()} theme={makeTheme("steps")} initialStep="a" />)
    const items = container.querySelectorAll(".fk-progress-step")
    expect(items).toHaveLength(3)
    expect(items[0]!.className).toContain("fk-progress-step--active")
  })

  it("names the current step via aria-valuetext, without rendering any title text", () => {
    const { container } = render(<FlowRunner flow={makeFlow()} theme={makeTheme("steps")} initialStep="b" />)
    expect(container.querySelector('[role="progressbar"]')!.getAttribute("aria-valuetext")).toBe("Contenuto")
    expect(container.querySelectorAll(".fk-progress-step-title")).toHaveLength(0)
    expect(container.querySelector(".fk-progress-current")).toBeNull()
  })

  it("collapses a long path into ellipsis markers, no title text at any length", () => {
    const { container } = render(
      <FlowRunner flow={makeLongFlow()} theme={makeTheme("steps")} initialStep="s5" />,
    )
    expect(container.querySelectorAll(".fk-progress-step-title")).toHaveLength(0)
    expect(container.querySelectorAll(".fk-progress-step-ellipsis").length).toBeGreaterThan(0)
    expect(container.querySelectorAll(".fk-progress-step").length).toBeLessThanOrEqual(7)
    expect(container.querySelector('[role="progressbar"]')!.getAttribute("aria-valuetext")).toBe("Passo 5")
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

describe("FlowRunner + segments progress variant", () => {
  it("renders one segment per resolved step, active one carrying its 1-based number", () => {
    const { container } = render(<FlowRunner flow={makeFlow()} theme={makeTheme("segments")} initialStep="b" />)
    const segments = container.querySelectorAll(".fk-progress-segment")
    expect(segments).toHaveLength(3)
    expect(segments[0]!.className).toContain("fk-progress-segment--completed")
    expect(segments[1]!.className).toContain("fk-progress-segment--active")
    expect(segments[1]!.textContent).toBe("2")
    expect(segments[2]!.className).not.toContain("completed")
    expect(segments[2]!.className).not.toContain("active")
  })

  it("never collapses, however many steps", () => {
    const { container } = render(
      <FlowRunner flow={makeLongFlow()} theme={makeTheme("segments")} initialStep="s5" />,
    )
    expect(container.querySelectorAll(".fk-progress-segment")).toHaveLength(9)
    expect(container.querySelectorAll(".fk-progress-step-ellipsis")).toHaveLength(0)
  })
})
