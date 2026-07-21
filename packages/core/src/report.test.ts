import { describe, expect, it } from "vitest"
import { buildReportRows, parseFlow, type Flow } from "./index"

const flow: Flow = parseFlow({
  id: "demo",
  title: "Demo",
  steps: [
    { id: "welcome", type: "intro", title: "Ciao" },
    { id: "mood", type: "faces", title: "Come ti senti?" },
    { id: "notes", type: "text", title: "Note", required: false },
    {
      id: "extras",
      type: "group",
      title: "Extra",
      layout: "stack",
      required: false,
      steps: [
        { id: "extra-notes", type: "notes", required: false },
        { id: "extra-photo", type: "media", required: false },
      ],
    },
    { id: "check", type: "review" },
    { id: "end", type: "confirmation" },
  ],
})

describe("buildReportRows", () => {
  it("excludes intro/review/confirmation and orders rows like the flow", () => {
    const rows = buildReportRows(flow, {})
    expect(rows.map((r) => r.title)).toEqual(["Come ti senti?", "Note", "Extra"])
  })

  it("formats a missing/empty answer as an em dash", () => {
    const rows = buildReportRows(flow, {})
    expect(rows.find((r) => r.title === "Note")!.value).toBe("—")
  })

  it("resolves a faces answer to its label, not the raw value", () => {
    const rows = buildReportRows(flow, { mood: "3" })
    expect(rows.find((r) => r.title === "Come ti senti?")!.value).toBe("Ok")
  })

  it("aggregates a group's children into a single comma-joined row", () => {
    const rows = buildReportRows(flow, {
      extras: { "extra-notes": "tutto ok", "extra-photo": [] },
    })
    expect(rows.find((r) => r.title === "Extra")!.value).toBe("tutto ok")
  })

  it("collects image items from a media step nested in a group for embedding", () => {
    const photo = { id: "p1", name: "a.png", mimeType: "image/png", size: 10, dataUrl: "data:image/png;base64,AA==", kind: "image" as const }
    const rows = buildReportRows(flow, {
      extras: { "extra-notes": "", "extra-photo": [photo] },
    })
    const row = rows.find((r) => r.title === "Extra")!
    expect(row.media).toEqual([photo])
  })

  it("summarizes a media/file answer as a count, not the raw items", () => {
    const photo = { id: "p1", name: "a.png", mimeType: "image/png", size: 10, dataUrl: "data:image/png;base64,AA==", kind: "image" as const }
    const rows = buildReportRows(flow, {
      extras: { "extra-notes": "", "extra-photo": [photo, photo] },
    })
    expect(rows.find((r) => r.title === "Extra")!.value).toBe("📷×2")
  })
})
