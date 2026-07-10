import type { Answers } from "@flowkit/core"

export interface ReceiptEmailTemplateOptions {
  title: string
  message?: string
  answers: Answers
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function formatAnswerValue(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string" && value.startsWith("data:")) return "📷"
  if (Array.isArray(value)) return escapeHtml(value.map(String).join(", "))
  if (typeof value === "object") {
    return escapeHtml(
      Object.entries(value as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${String(formatAnswerValue(v))}`)
        .join(", "),
    )
  }
  return escapeHtml(String(value))
}

/**
 * Genera l'HTML (stili inline, compatibile client email) per l'email di riepilogo che un
 * backend invia via resultActions.emailApi. Colori/raggi presi 1:1 dal tema notion-clean
 * (light) perché i client email non supportano variabili CSS: vanno inlineati. Funzione di
 * riferimento per il backend del consumer — non è chiamata da nessun codice client-side di
 * questo repo, l'invio effettivo dell'email avviene sempre lato server.
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
