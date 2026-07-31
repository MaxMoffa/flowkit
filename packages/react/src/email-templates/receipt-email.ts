import type { Answers } from "@flowkit-io/core"
import { escapeHtml, safeImageDataUrl } from "../html"
import { classifyAnswerValue } from "../answer-value"

export interface ReceiptEmailTemplateOptions {
  title: string
  message?: string
  answers: Answers
}

function imgTag(src: string): string {
  return `<img src="${src}" alt="" width="96" style="border-radius:8px;margin:0 6px 6px 0;" />`
}

function formatAnswerValue(value: unknown): string {
  const classified = classifyAnswerValue(value)
  switch (classified.kind) {
    case "empty":
      return ""
    case "data-url": {
      if (!classified.isImage) return "📷"
      const src = safeImageDataUrl(classified.url)
      return src ? imgTag(src) : "📷"
    }
    case "uploaded-items": {
      if (classified.items.length === 0) return ""
      const images = classified.items
        .filter((item) => item.kind === "image")
        .map((item) => safeImageDataUrl(item.dataUrl))
        .filter((src): src is string => src !== null)
        .map(imgTag)
        .join("")
      return images || escapeHtml(`${classified.items.length} allegato/i`)
    }
    case "array":
      return escapeHtml(classified.items.map(String).join(", "))
    case "nested":
      return escapeHtml(
        Object.entries(classified.value)
          .map(([k, v]) => `${k}: ${formatAnswerValue(v)}`)
          .join(", "),
      )
    case "scalar":
      return escapeHtml(String(classified.value))
  }
}

/**
 * Generates the HTML (inline styles, email-client compatible) for the receipt email a
 * backend sends via resultActions.emailApi. Colors/radii taken 1:1 from the notion-clean
 * (light) theme because email clients don't support CSS variables: they must be inlined.
 * A reference function for the consumer's backend — not called from any client-side code
 * in this repo, the actual email send always happens server-side.
 */
export function renderReceiptEmailHtml({ title, message, answers }: ReceiptEmailTemplateOptions): string {
  const rows = Object.entries(answers)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(
      ([key, value]) => `<tr>
        <td style="padding:8px 0;color:#7D7A75;font-size:13px;">${escapeHtml(key)}</td>
        <td style="padding:8px 0;color:#2C2C2B;font-size:14px;">${formatAnswerValue(value)}</td>
      </tr>`,
    )
    .join("")

  return `<!doctype html>
<html>
  <body style="margin:0;background:#F9F8F7;font-family:sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;padding:32px 16px;">
      <tr>
        <td style="background:#FFFFFF;border:1px solid #E6E5E3;border-radius:14px;padding:24px;">
          <h1 style="color:#2C2C2B;font-size:20px;margin:0 0 8px;">${escapeHtml(title)}</h1>
          ${message ? `<p style="color:#7D7A75;font-size:14px;margin:0 0 16px;">${escapeHtml(message)}</p>` : ""}
          <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
