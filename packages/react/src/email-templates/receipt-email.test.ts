import { describe, it, expect } from "vitest"
import type { Answers, UploadedItem } from "@flowkit-io/core"
import { renderReceiptEmailHtml } from "./receipt-email"

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

/** AnswerValue does not structurally include UploadedItem[], so media answers need the
 *  same cast the media/file steps perform when they write the value. */
function render(options: { title: string; message?: string; answers: Record<string, unknown> }) {
  return renderReceiptEmailHtml({ ...options, answers: options.answers as Answers })
}

describe("renderReceiptEmailHtml", () => {
  it("renders title, message and answer rows", () => {
    const html = render({ title: "Grazie", message: "Ecco il tuo resoconto", answers: { nota: "ok" } })
    expect(html).toContain("<h1 style=\"color:#2C2C2B;font-size:20px;margin:0 0 8px;\">Grazie</h1>")
    expect(html).toContain("Ecco il tuo resoconto")
    expect(html).toContain("nota")
    expect(html).toContain("ok")
  })

  it("escapes the title and the answer values", () => {
    const html = render({ title: '<img src=x onerror="alert(1)">', answers: { nota: "<b>hi</b>" } })
    expect(html).not.toContain("<img src=x")
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;")
    expect(html).toContain("&lt;b&gt;hi&lt;/b&gt;")
  })

  it("skips empty answers", () => {
    const html = render({ title: "T", answers: { vuoto: "", assente: null } })
    expect(html).not.toContain("vuoto")
    expect(html).not.toContain("assente")
  })

  it("embeds a well-formed image data URL", () => {
    const html = render({ title: "T", answers: { foto: [uploadedItem()] } })
    expect(html).toContain(`<img src="${PNG}"`)
  })

  it("drops a data URL whose mime type breaks out of the src attribute", () => {
    const hostile = 'data:image/png";onerror="alert(1);base64,iVBORw0KGgo='
    const html = render({ title: "T", answers: { foto: [uploadedItem({ dataUrl: hostile })] } })
    expect(html).not.toContain("onerror")
    expect(html).not.toContain("<img")
  })

  it("falls back to the attachment count when no image survives validation", () => {
    const html = render({
      title: "T",
      answers: { foto: [uploadedItem({ dataUrl: "javascript:alert(1)" })] },
    })
    expect(html).not.toContain("<img")
    expect(html).toContain("1 allegato/i")
  })
})
