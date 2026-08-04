import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { StepTitle } from "./step-title"

describe("StepTitle", () => {
  it("renders nothing when both title and image are unset", () => {
    const { container } = render(<StepTitle />)
    expect(container.firstChild).toBeNull()
  })

  it("renders just the title, with no icon markup, when image is unset", () => {
    const { container } = render(<StepTitle title="Ciao" />)
    const h2 = container.querySelector("h2.fk-title")!
    expect(h2.textContent).toBe("Ciao")
    expect(h2.querySelector(".fk-title-icon")).toBeNull()
  })

  it("renders just the icon when title is unset", () => {
    const { container } = render(<StepTitle image={{ kind: "emoji", value: "📍" }} />)
    const h2 = container.querySelector("h2.fk-title")!
    expect(h2).not.toBeNull()
    expect(h2.querySelector(".fk-title-icon")?.textContent).toBe("📍")
  })

  it("renders icon and title together, icon first", () => {
    const { container } = render(<StepTitle image={{ kind: "emoji", value: "📍" }} title="Dove sei?" />)
    const h2 = container.querySelector("h2.fk-title")!
    expect(h2.textContent).toBe("📍Dove sei?")
  })

  it("uses an <h1> when level='h1'", () => {
    const { container } = render(<StepTitle title="Grazie!" level="h1" />)
    expect(container.querySelector("h1.fk-title")).not.toBeNull()
    expect(container.querySelector("h2.fk-title")).toBeNull()
  })

  it.each([
    ["emoji", { kind: "emoji" as const, value: "🎉" }],
    ["icon", { kind: "icon" as const, value: '<svg><circle r="4" /></svg>' }],
    ["image", { kind: "image" as const, value: "https://example.com/a.png" }],
  ])("supports image kind %s", (_label, image) => {
    const { container } = render(<StepTitle image={image} title="X" />)
    expect(container.querySelector(".fk-title-icon")).not.toBeNull()
  })
})
