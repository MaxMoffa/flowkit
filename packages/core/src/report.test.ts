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
    { id: "sig", type: "signature", title: "Firma" },
    { id: "check", type: "review" },
    { id: "end", type: "confirmation" },
  ],
})

describe("buildReportRows", () => {
  it("excludes intro/review/confirmation and orders rows like the flow", () => {
    const rows = buildReportRows(flow, {})
    expect(rows.map((r) => r.title)).toEqual(["Come ti senti?", "Note", "Extra", "Firma"])
  })

  it("carries the originating step's id on every row", () => {
    const rows = buildReportRows(flow, {})
    expect(rows.map((r) => r.stepId)).toEqual(["mood", "notes", "extras", "sig"])
  })

  it("excludes a checkpoint review step just like a final one", () => {
    const withCheckpoint: Flow = parseFlow({
      id: "demo2",
      title: "Demo 2",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "mood", type: "faces", title: "Come ti senti?" },
        { id: "midway", type: "review", mode: "checkpoint" },
        { id: "notes", type: "text", title: "Note", required: false },
        { id: "end", type: "confirmation" },
      ],
    })
    const rows = buildReportRows(withCheckpoint, {})
    expect(rows.map((r) => r.stepId)).toEqual(["mood", "notes"])
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

  it("renders a signature answer as a label plus an embeddable svg image, not raw text", () => {
    const svgDataUrl = "data:image/svg+xml;base64,PHN2Zy8+"
    const rows = buildReportRows(flow, { sig: svgDataUrl })
    const row = rows.find((r) => r.title === "Firma")!
    expect(row.value).toBe("✍️ Firma")
    expect(row.media).toEqual([
      { id: "sig", name: "signature", mimeType: "image/svg+xml", size: 0, dataUrl: svgDataUrl, kind: "image" },
    ])
  })
})
