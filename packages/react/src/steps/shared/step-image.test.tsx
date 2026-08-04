import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { StepImage, sanitizeStepIcon, stepImageToHtml } from "./step-image"

describe("StepImage", () => {
  it("renders nothing when image is undefined", () => {
    const { container } = render(<StepImage image={undefined} size="badge" />)
    expect(container.firstChild).toBeNull()
  })

  it("renders an emoji as plain text", () => {
    const { container } = render(<StepImage image={{ kind: "emoji", value: "🎉" }} size="badge" />)
    expect(container.querySelector(".fk-intro-badge")?.textContent).toBe("🎉")
  })

  it("renders an image kind via <img>", () => {
    const { container } = render(<StepImage image={{ kind: "image", value: "https://example.com/a.png" }} size="review" />)
    const img = container.querySelector(".fk-review-icon img") as HTMLImageElement
    expect(img).not.toBeNull()
    expect(img.getAttribute("src")).toBe("https://example.com/a.png")
  })

  it("renders the 'inline' size (used by non-intro step titles) with the .fk-title-icon class", () => {
    const { container } = render(<StepImage image={{ kind: "emoji", value: "📍" }} size="inline" />)
    expect(container.querySelector(".fk-title-icon")?.textContent).toBe("📍")
  })

  it("sanitizes an icon kind's SVG markup before mounting it", () => {
    const { container } = render(
      <StepImage
        image={{ kind: "icon", value: '<svg onload="alert(1)"><script>alert(2)</script><circle r="4" /></svg>' }}
        size="badge"
      />,
    )
    const wrapper = container.querySelector(".fk-intro-badge")!
    expect(wrapper.querySelector("script")).toBeNull()
    expect(wrapper.innerHTML).not.toContain("onload")
    expect(wrapper.querySelector("circle")).not.toBeNull()
  })
})

describe("sanitizeStepIcon", () => {
  it("strips <script> tags and event-handler attributes, keeps safe SVG content", () => {
    const clean = sanitizeStepIcon('<svg onload="alert(1)"><script>alert(2)</script><path d="M0 0" /></svg>')
    expect(clean).not.toContain("<script")
    expect(clean).not.toContain("onload")
    expect(clean).toContain("<path")
  })
})

describe("stepImageToHtml", () => {
  it("returns an empty string when image is undefined", () => {
    expect(stepImageToHtml(undefined, "fk-review-icon")).toBe("")
  })

  it("escapes an emoji value", () => {
    expect(stepImageToHtml({ kind: "emoji", value: "<x>" }, "fk-review-icon")).toBe(
      '<span class="fk-review-icon">&lt;x&gt;</span>',
    )
  })

  it("sanitizes icon markup the same way as the React component", () => {
    const html = stepImageToHtml({ kind: "icon", value: '<svg onload="x"><script>x</script></svg>' }, "fk-review-icon")
    expect(html).not.toContain("<script")
    expect(html).not.toContain("onload")
  })

  it("renders an image kind as an <img> tag", () => {
    expect(stepImageToHtml({ kind: "image", value: "https://example.com/a.png" }, "fk-review-icon")).toBe(
      '<span class="fk-review-icon"><img src="https://example.com/a.png" alt="" /></span>',
    )
  })
})
