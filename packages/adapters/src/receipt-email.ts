import type { Answers } from "@flowkit/core"

export interface ReceiptEmailAdapterOptions {
  baseUrl: string
  headers?: Record<string, string>
  fetchImpl?: typeof fetch
}

export interface ReceiptEmailAdapter {
  /** Asks the backend to send a receipt email to the given address. No local state. */
  sendReceiptEmail(flowId: string, email: string, answers: Answers): Promise<void>
}

/** Adapter that calls a REST endpoint to have the backend send a receipt email. */
export function createReceiptEmailAdapter(options: ReceiptEmailAdapterOptions): ReceiptEmailAdapter {
  const fetchImpl = options.fetchImpl ?? fetch

  return {
    async sendReceiptEmail(flowId, email, answers) {
      const res = await fetchImpl(`${options.baseUrl}/flows/${flowId}/receipt-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...options.headers },
        body: JSON.stringify({ email, answers }),
      })
      if (!res.ok) {
        throw new Error(`Email send failed: ${res.status} ${res.statusText}`)
      }
    },
  }
}
