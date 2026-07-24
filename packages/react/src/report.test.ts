import { describe, it, expect } from "vitest"
import type { Answers, Flow, UploadedItem } from "@flowkit-io/core"
import { renderAnswersReportHtml } from "./report"

const PNG = "data:image/png;base64,iVBORw0KGgo="

function uploadedItem(overrides: Partial<UploadedItem> = {}): UploadedItem {
  return {
    id: "u1",
    name: "photo.png",
    mimeType: "image/png",
    size: 10,
    dataUrl: PNG,
    kind: "image",
    ...overrides,
  }
}

const flow: Flow = {
  id: "f",
  title: "Resoconto",
  steps: [
    { id: "note", type: "notes", title: "Note" },
    { id: "foto", type: "media", title: "Foto" },
  ],
} as Flow

/** AnswerValue does not structurally include UploadedItem[], so media answers need the
 *  same cast the media/file steps perform when they write the value. */
function render(answers: Record<string, unknown>) {
  return renderAnswersReportHtml(flow, answers as Answers)
}

describe("renderAnswersReportHtml", () => {
  it("renders the review box markup with the row values", () => {
    const html = render({ note: "tutto bene" })
    expect(html).toContain('<div class="fk-review-box">')
    expect(html).toContain("<h1>Resoconto</h1>")
    expect(html).toContain("tutto bene")
  })

  it("escapes text so an answer cannot inject markup", () => {
    const html = render({ note: '<script>alert("x")</script>' })
    expect(html).not.toContain("<script>")
    expect(html).toContain("&lt;script&gt;")
  })

  it("embeds a well-formed image data URL", () => {
    const html = render({ foto: [uploadedItem()] })
    expect(html).toContain(`<img src="${PNG}" alt="" />`)
  })

  it("drops a data URL whose mime type breaks out of the src attribute", () => {
    const hostile = 'data:image/png";onerror="alert(1);base64,iVBORw0KGgo='
    const html = render({ foto: [uploadedItem({ dataUrl: hostile })] })
    expect(html).not.toContain("onerror")
    expect(html).not.toContain("<img")
  })

  it("drops a non-image data URL", () => {
    const html = render({ foto: [uploadedItem({ dataUrl: "data:text/html;base64,PHNjcmlwdD4=" })] })
    expect(html).not.toContain("<img")
  })

  it("omits the media wrapper entirely when no image survives validation", () => {
    const html = render({ foto: [uploadedItem({ dataUrl: "javascript:alert(1)" })] })
    expect(html).not.toContain("fk-review-media")
  })
})
