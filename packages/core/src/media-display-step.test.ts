import { describe, expect, it } from "vitest"
import { mediaDisplayStepSchema } from "./index"

describe("media-display step schema", () => {
  it("defaults required to false, kind to image, fit to cover, controls to true", () => {
    const step = mediaDisplayStepSchema.parse({
      id: "banner",
      type: "media-display",
      src: "https://example.test/photo.jpg",
    })
    expect(step.required).toBe(false)
    expect(step.kind).toBe("image")
    expect(step.fit).toBe("cover")
    expect(step.controls).toBe(true)
    expect(step.autoplay).toBe(false)
    expect(step.muted).toBe(false)
  })

  it("requires src", () => {
    expect(() =>
      mediaDisplayStepSchema.parse({ id: "banner", type: "media-display" }),
    ).toThrow()
    expect(() =>
      mediaDisplayStepSchema.parse({ id: "banner", type: "media-display", src: "" }),
    ).toThrow()
  })

  it("rejects autoplay:true without muted:true", () => {
    expect(() =>
      mediaDisplayStepSchema.parse({
        id: "clip",
        type: "media-display",
        kind: "video",
        src: "https://example.test/clip.mp4",
        autoplay: true,
      }),
    ).toThrow(/autoplay:true requires muted:true/)
  })

  it("accepts autoplay:true with muted:true", () => {
    const step = mediaDisplayStepSchema.parse({
      id: "clip",
      type: "media-display",
      kind: "video",
      src: "https://example.test/clip.mp4",
      autoplay: true,
      muted: true,
    })
    expect(step.autoplay).toBe(true)
    expect(step.muted).toBe(true)
  })

  it("allows overriding required explicitly", () => {
    const step = mediaDisplayStepSchema.parse({
      id: "banner",
      type: "media-display",
      src: "https://example.test/photo.jpg",
      required: true,
    })
    expect(step.required).toBe(true)
  })
})
