import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import type { MediaDisplayStep } from "@flowkit-io/core"
import { MediaDisplayStepView } from "./media-display"

const baseFlow = { id: "t", title: "t", locale: "it", steps: [], disableBack: false, timezone: "UTC" }

function makeProps(step: Partial<MediaDisplayStep>) {
  return {
    step: { id: "preview", type: "media-display", required: false, kind: "image", src: "/a.jpg", ...step } as MediaDisplayStep,
    value: null,
    onChange: () => {},
    flow: baseFlow,
    answers: {},
    meta: {},
    onMetaChange: () => {},
  } as const
}

describe("MediaDisplayStepView", () => {
  it("renders an <img> for kind:image, with alt and srcSet from sources", () => {
    const { container } = render(
      <MediaDisplayStepView
        {...makeProps({
          kind: "image",
          src: "/a.jpg",
          alt: "A photo",
          sources: [{ src: "/a-2x.jpg" }, { src: "/a-3x.jpg" }],
        })}
      />,
    )
    const img = container.querySelector("img.fk-media-display-image") as HTMLImageElement
    expect(img).not.toBeNull()
    expect(img.getAttribute("src")).toBe("/a.jpg")
    expect(img.getAttribute("alt")).toBe("A photo")
    expect(img.getAttribute("srcset")).toBe("/a-2x.jpg, /a-3x.jpg")
    expect(container.querySelector("video")).toBeNull()
  })

  it("renders a <video> for kind:video, with playback attributes and <source> children", () => {
    const { container } = render(
      <MediaDisplayStepView
        {...makeProps({
          kind: "video",
          src: "/clip.mp4",
          poster: "/poster.jpg",
          autoplay: true,
          muted: true,
          loop: true,
          controls: false,
          sources: [{ src: "/clip.webm", type: "video/webm" }],
        })}
      />,
    )
    const video = container.querySelector("video.fk-media-display-video") as HTMLVideoElement
    expect(video).not.toBeNull()
    expect(video.getAttribute("src")).toBe("/clip.mp4")
    expect(video.getAttribute("poster")).toBe("/poster.jpg")
    expect(video.autoplay).toBe(true)
    expect(video.muted).toBe(true)
    expect(video.loop).toBe(true)
    expect(video.controls).toBe(false)
    expect(container.querySelector("source")?.getAttribute("src")).toBe("/clip.webm")
  })

  it("renders the caption only when set", () => {
    const { container, rerender } = render(<MediaDisplayStepView {...makeProps({ caption: "A caption" })} />)
    expect(container.querySelector(".fk-media-display-caption")?.textContent).toBe("A caption")

    rerender(<MediaDisplayStepView {...makeProps({ caption: undefined })} />)
    expect(container.querySelector(".fk-media-display-caption")).toBeNull()
  })

  it("collects no answer: never renders any input/interactive control", () => {
    const { container } = render(<MediaDisplayStepView {...makeProps({})} />)
    expect(container.querySelector("input, button, select, textarea")).toBeNull()
  })
})
