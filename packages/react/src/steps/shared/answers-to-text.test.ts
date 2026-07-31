import { describe, expect, it } from "vitest"
import { answersToText } from "./answers-to-text"

describe("answersToText", () => {
  it("skips null/undefined/empty-string values", () => {
    expect(answersToText({ a: null, b: undefined, c: "", d: "kept" })).toBe("d: kept")
  })

  it("formats a scalar as 'key: value'", () => {
    expect(answersToText({ name: "Mario" })).toBe("name: Mario")
  })

  it("joins array values with a comma", () => {
    expect(answersToText({ tags: ["a", "b", "c"] })).toBe("tags: a, b, c")
  })

  it("omits any data: URL entirely, image or not", () => {
    expect(answersToText({ photo: "data:image/png;base64,AAA", file: "data:application/pdf;base64,BBB" })).toBe("")
  })

  it("summarizes an UploadedItem[] as a count, and skips it when empty", () => {
    const items = [{ id: "1", name: "a.jpg", mimeType: "image/jpeg", size: 1, dataUrl: "data:image/jpeg;base64,x", kind: "image" as const }]
    expect(answersToText({ media: items })).toBe("media: 1 allegato/i")
    expect(answersToText({ media: [] })).toBe("")
  })

  it("recurses into a nested object (group answer) with a dotted prefix", () => {
    expect(answersToText({ group: { a: "1", b: "2" } })).toBe("group.a: 1\ngroup.b: 2")
  })

  it("omits a nested object that flattens to nothing", () => {
    expect(answersToText({ group: { a: null, b: "" } })).toBe("")
  })
})
