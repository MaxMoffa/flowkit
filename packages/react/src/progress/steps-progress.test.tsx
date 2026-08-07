import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { StepsProgress, buildStepperItems } from "./steps-progress"

const steps = [
  { title: "Database", subtitle: "Scegli la fonte" },
  { title: "Contenuto", subtitle: "Rivedi gli step generati" },
  { title: "Dettagli", subtitle: "Nome e aspetto" },
]

function makeSteps(n: number) {
  return Array.from({ length: n }, (_, i) => ({ title: `Step ${i + 1}`, subtitle: `Desc ${i + 1}` }))
}

describe("StepsProgress", () => {
  it("renders a numbered circle and an inline title per step", () => {
    const { container } = render(<StepsProgress pct={33} currentIndex={0} total={3} steps={steps} />)
    const items = container.querySelectorAll(".fk-progress-step")
    expect(items).toHaveLength(3)
    expect(items[0]!.querySelector(".fk-progress-step-circle")?.textContent).toBe("1")
    expect(items[0]!.querySelector(".fk-progress-step-title")?.textContent).toBe("Database")
    expect(items[1]!.querySelector(".fk-progress-step-title")?.textContent).toBe("Contenuto")
  })

  it("shows the description only for the current step, in its own row", () => {
    const { container } = render(<StepsProgress pct={66} currentIndex={1} total={3} steps={steps} />)
    // No description is rendered inside the per-step columns, whatever their state.
    expect(container.querySelectorAll(".fk-progress-step .fk-progress-current-subtitle")).toHaveLength(0)
    expect(container.querySelectorAll(".fk-progress-step-subtitle")).toHaveLength(0)
    const current = container.querySelector(".fk-progress-current")!
    expect(current.querySelector(".fk-progress-current-title")?.textContent).toBe("Contenuto")
    expect(current.querySelector(".fk-progress-current-subtitle")?.textContent).toBe(
      "Rivedi gli step generati",
    )
  })

  it("moves the current row's title/description as the current step changes", () => {
    const { container, rerender } = render(
      <StepsProgress pct={33} currentIndex={0} total={3} steps={steps} />,
    )
    expect(container.querySelector(".fk-progress-current-title")?.textContent).toBe("Database")
    rerender(<StepsProgress pct={100} currentIndex={2} total={3} steps={steps} />)
    expect(container.querySelector(".fk-progress-current-title")?.textContent).toBe("Dettagli")
    expect(container.querySelector(".fk-progress-current-subtitle")?.textContent).toBe("Nome e aspetto")
  })

  it("exposes the full text as a title attribute, so a truncated label stays readable", () => {
    const { container } = render(<StepsProgress pct={33} currentIndex={0} total={3} steps={steps} />)
    expect(container.querySelector(".fk-progress-step-title")?.getAttribute("title")).toBe("Database")
    expect(container.querySelector(".fk-progress-current-subtitle")?.getAttribute("title")).toBe(
      "Scegli la fonte",
    )
  })

  it("marks the current step active with aria-current, others not", () => {
    const { container } = render(<StepsProgress pct={33} currentIndex={0} total={3} steps={steps} />)
    const items = container.querySelectorAll(".fk-progress-step")
    expect(items[0]!.className).toContain("fk-progress-step--active")
    expect(items[0]!.getAttribute("aria-current")).toBe("step")
    expect(items[1]!.className).toContain("fk-progress-step--upcoming")
    expect(items[1]!.getAttribute("aria-current")).toBeNull()
    expect(items[2]!.className).toContain("fk-progress-step--upcoming")
  })

  it("marks steps before currentIndex as completed, with a filled connecting line", () => {
    const { container } = render(<StepsProgress pct={66} currentIndex={1} total={3} steps={steps} />)
    const items = container.querySelectorAll(".fk-progress-step")
    expect(items[0]!.className).toContain("fk-progress-step--completed")
    expect(items[0]!.querySelector(".fk-progress-step-circle")?.textContent).toBe("✓")
    expect(items[0]!.querySelector(".fk-progress-step-line")?.className).toContain(
      "fk-progress-step-line--filled",
    )
    expect(items[1]!.className).toContain("fk-progress-step--active")
    expect(items[1]!.querySelector(".fk-progress-step-circle")?.textContent).toBe("2")
  })

  it("renders no connecting line after the last step", () => {
    const { container } = render(<StepsProgress pct={100} currentIndex={2} total={3} steps={steps} />)
    const items = container.querySelectorAll(".fk-progress-step")
    expect(items[2]!.querySelector(".fk-progress-step-line")).toBeNull()
  })

  it("sets role=progressbar with 1-based aria-valuenow and names the current step", () => {
    const { container } = render(<StepsProgress pct={33} currentIndex={0} total={3} steps={steps} />)
    const el = container.querySelector('[role="progressbar"]')!
    expect(el.getAttribute("aria-valuenow")).toBe("1")
    expect(el.getAttribute("aria-valuemin")).toBe("1")
    expect(el.getAttribute("aria-valuemax")).toBe("3")
    expect(el.getAttribute("aria-valuetext")).toBe("Database")
  })

  it("drops the inline titles on many-step flows and marks the stepper dense", () => {
    const { container } = render(
      <StepsProgress pct={50} currentIndex={2} total={6} steps={makeSteps(6)} />,
    )
    expect(container.querySelector(".fk-progress-stepper")!.className).toContain(
      "fk-progress-stepper--dense",
    )
    expect(container.querySelectorAll(".fk-progress-step-label")).toHaveLength(0)
    // The current step's title/description survive in their own row.
    expect(container.querySelector(".fk-progress-current-title")?.textContent).toBe("Step 3")
    expect(container.querySelector(".fk-progress-current-subtitle")?.textContent).toBe("Desc 3")
  })

  it("keeps inline titles (not dense) up to five steps", () => {
    const { container } = render(
      <StepsProgress pct={50} currentIndex={2} total={5} steps={makeSteps(5)} />,
    )
    expect(container.querySelector(".fk-progress-stepper")!.className).not.toContain("--dense")
    expect(container.querySelectorAll(".fk-progress-step-title")).toHaveLength(5)
  })

  it("collapses the middle of a long path into ellipsis markers", () => {
    const { container } = render(
      <StepsProgress pct={50} currentIndex={5} total={12} steps={makeSteps(12)} />,
    )
    const circles = [...container.querySelectorAll(".fk-progress-step-circle")].map(
      (c) => c.textContent,
    )
    // first, current ±1, last — everything else collapsed.
    expect(circles).toEqual(["✓", "✓", "6", "7", "12"])
    expect(container.querySelectorAll(".fk-progress-step-ellipsis")).toHaveLength(2)
    expect(container.querySelectorAll(".fk-progress-step")).toHaveLength(7)
  })

  it("keeps the ellipsis markers out of the accessibility tree and off aria-current", () => {
    const { container } = render(
      <StepsProgress pct={50} currentIndex={5} total={12} steps={makeSteps(12)} />,
    )
    const gaps = container.querySelectorAll(".fk-progress-step--gap")
    expect(gaps).toHaveLength(2)
    for (const gap of gaps) {
      expect(gap.getAttribute("aria-current")).toBeNull()
      expect(gap.querySelector(".fk-progress-step-ellipsis")?.getAttribute("aria-hidden")).toBe("true")
    }
  })

  it("renders every step when the path is short enough to fit", () => {
    const { container } = render(
      <StepsProgress pct={50} currentIndex={3} total={7} steps={makeSteps(7)} />,
    )
    expect(container.querySelectorAll(".fk-progress-step")).toHaveLength(7)
    expect(container.querySelectorAll(".fk-progress-step-ellipsis")).toHaveLength(0)
  })

  it("handles many steps and long titles/descriptions without throwing", () => {
    const manySteps = Array.from({ length: 8 }, (_, i) => ({
      title: `Passo numero molto lungo ${i + 1}`,
      subtitle: "Una descrizione piuttosto estesa che potrebbe andare a capo o troncarsi",
    }))
    const { container } = render(
      <StepsProgress pct={50} currentIndex={4} total={8} steps={manySteps} />,
    )
    expect(container.querySelectorAll(".fk-progress-step").length).toBeLessThanOrEqual(7)
    expect(container.querySelector(".fk-progress-current-title")?.textContent).toBe(
      "Passo numero molto lungo 5",
    )
  })

  it("renders steps with no title/description without a label block or current row", () => {
    const { container } = render(
      <StepsProgress pct={50} currentIndex={0} total={2} steps={[{}, {}]} />,
    )
    const items = container.querySelectorAll(".fk-progress-step")
    expect(items[0]!.querySelector(".fk-progress-step-label")).toBeNull()
    expect(container.querySelector(".fk-progress-current")).toBeNull()
    expect(container.querySelector('[role="progressbar"]')!.getAttribute("aria-valuetext")).toBeNull()
  })

  it("renders the current row with only the description when the step has no title", () => {
    const { container } = render(
      <StepsProgress pct={50} currentIndex={0} total={2} steps={[{ subtitle: "Solo testo" }, {}]} />,
    )
    expect(container.querySelector(".fk-progress-current-title")).toBeNull()
    expect(container.querySelector(".fk-progress-current-subtitle")?.textContent).toBe("Solo testo")
  })

  it("falls back to pulsing dots when total is null (indeterminate)", () => {
    const { container } = render(<StepsProgress pct={null} currentIndex={0} total={null} />)
    expect(container.querySelector(".fk-progress-dots.fk-progress-indeterminate")).not.toBeNull()
    expect(container.querySelectorAll(".fk-progress-dot")).toHaveLength(3)
  })

  it("falls back to pulsing dots when steps is missing even though total is known", () => {
    const { container } = render(<StepsProgress pct={33} currentIndex={0} total={3} />)
    expect(container.querySelector(".fk-progress-dots.fk-progress-indeterminate")).not.toBeNull()
  })
})

describe("buildStepperItems", () => {
  it("maps short paths one-to-one", () => {
    const items = buildStepperItems(makeSteps(7), 3)
    expect(items).toHaveLength(7)
    expect(items.every((i) => i.kind === "step")).toBe(true)
  })

  it("never returns more than seven items, whatever the path length and position", () => {
    for (const n of [8, 12, 40]) {
      for (let cur = 0; cur < n; cur++) {
        expect(buildStepperItems(makeSteps(n), cur).length).toBeLessThanOrEqual(7)
      }
    }
  })

  it("always keeps first, last and the current step with its neighbours", () => {
    const items = buildStepperItems(makeSteps(20), 9)
    const kept = items.flatMap((i) => (i.kind === "step" ? [i.index] : []))
    expect(kept).toEqual([0, 8, 9, 10, 19])
  })

  it("keeps a one-step gap as a real step instead of collapsing it", () => {
    // n=8, current=3 -> anchors 0,2,3,4,7: index 1 is alone between two anchors.
    const items = buildStepperItems(makeSteps(8), 3)
    const kept = items.flatMap((i) => (i.kind === "step" ? [i.index] : []))
    expect(kept).toEqual([0, 1, 2, 3, 4, 7])
    expect(items.filter((i) => i.kind === "gap")).toHaveLength(1)
  })

  it("marks a fully traversed gap completed and a future one upcoming", () => {
    const items = buildStepperItems(makeSteps(12), 5)
    const gaps = items.flatMap((i) => (i.kind === "gap" ? [i] : []))
    expect(gaps).toHaveLength(2)
    expect(gaps[0]!.state).toBe("completed")
    expect(gaps[0]!.count).toBe(3)
    expect(gaps[1]!.state).toBe("upcoming")
  })
})
