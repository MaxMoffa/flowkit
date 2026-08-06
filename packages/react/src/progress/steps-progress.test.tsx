import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { StepsProgress } from "./steps-progress"

const steps = [
  { title: "Database", subtitle: "Scegli la fonte" },
  { title: "Contenuto", subtitle: "Rivedi gli step generati" },
  { title: "Dettagli", subtitle: "Nome e aspetto" },
]

describe("StepsProgress", () => {
  it("renders a numbered circle and label per step", () => {
    const { container } = render(<StepsProgress pct={33} currentIndex={0} total={3} steps={steps} />)
    const items = container.querySelectorAll(".fk-progress-step")
    expect(items).toHaveLength(3)
    expect(items[0]!.querySelector(".fk-progress-step-title")?.textContent).toBe("Database")
    expect(items[0]!.querySelector(".fk-progress-step-subtitle")?.textContent).toBe("Scegli la fonte")
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

  it("sets role=progressbar with 1-based aria-valuenow", () => {
    const { container } = render(<StepsProgress pct={33} currentIndex={0} total={3} steps={steps} />)
    const el = container.querySelector('[role="progressbar"]')!
    expect(el.getAttribute("aria-valuenow")).toBe("1")
    expect(el.getAttribute("aria-valuemin")).toBe("1")
    expect(el.getAttribute("aria-valuemax")).toBe("3")
  })

  it("handles many steps and long titles/subtitles without throwing", () => {
    const manySteps = Array.from({ length: 8 }, (_, i) => ({
      title: `Passo numero molto lungo ${i + 1}`,
      subtitle: "Una descrizione piuttosto estesa che potrebbe andare a capo o troncarsi",
    }))
    const { container } = render(
      <StepsProgress pct={50} currentIndex={4} total={8} steps={manySteps} />,
    )
    expect(container.querySelectorAll(".fk-progress-step")).toHaveLength(8)
  })

  it("renders steps with no title/subtitle without a label block", () => {
    const { container } = render(
      <StepsProgress pct={50} currentIndex={0} total={2} steps={[{}, {}]} />,
    )
    const items = container.querySelectorAll(".fk-progress-step")
    expect(items[0]!.querySelector(".fk-progress-step-label")).toBeNull()
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
