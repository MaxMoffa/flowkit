import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { SegmentsProgress } from "./segments-progress"

describe("SegmentsProgress", () => {
  it("renders one segment per step, completed/active/upcoming states", () => {
    const { container } = render(<SegmentsProgress pct={50} currentIndex={1} total={4} />)
    const segments = container.querySelectorAll(".fk-progress-segment")
    expect(segments).toHaveLength(4)
    expect(segments[0]!.className).toContain("fk-progress-segment--completed")
    expect(segments[1]!.className).toContain("fk-progress-segment--active")
    expect(segments[2]!.className).not.toMatch(/completed|active/)
    expect(segments[3]!.className).not.toMatch(/completed|active/)
  })

  it("shows the 1-based step number only on the active segment", () => {
    const { container } = render(<SegmentsProgress pct={75} currentIndex={2} total={4} />)
    const segments = container.querySelectorAll(".fk-progress-segment")
    expect(segments[2]!.textContent).toBe("3")
    expect(segments[0]!.textContent).toBe("")
    expect(segments[3]!.textContent).toBe("")
  })

  it("marks the active segment aria-current and hides the rest from assistive tech", () => {
    const { container } = render(<SegmentsProgress pct={50} currentIndex={1} total={4} />)
    const segments = container.querySelectorAll(".fk-progress-segment")
    expect(segments[1]!.getAttribute("aria-current")).toBe("step")
    expect(segments[0]!.getAttribute("aria-hidden")).toBe("true")
    expect(segments[2]!.getAttribute("aria-hidden")).toBe("true")
  })

  it("sets role=progressbar with 1-based aria-valuenow", () => {
    const { container } = render(<SegmentsProgress pct={50} currentIndex={1} total={4} />)
    const el = container.querySelector('[role="progressbar"]')!
    expect(el.getAttribute("aria-valuenow")).toBe("2")
    expect(el.getAttribute("aria-valuemin")).toBe("1")
    expect(el.getAttribute("aria-valuemax")).toBe("4")
  })

  it("never collapses, however many steps", () => {
    const { container } = render(<SegmentsProgress pct={10} currentIndex={0} total={40} />)
    expect(container.querySelectorAll(".fk-progress-segment")).toHaveLength(40)
  })

  it("falls back to pulsing dots when total is null (indeterminate)", () => {
    const { container } = render(<SegmentsProgress pct={null} currentIndex={0} total={null} />)
    expect(container.querySelector(".fk-progress-dots.fk-progress-indeterminate")).not.toBeNull()
    expect(container.querySelectorAll(".fk-progress-dot")).toHaveLength(3)
  })
})
