import type { Answers } from "@flowkit/core"

export interface ReceiptEmailAdapterOptions {
  baseUrl: string
  headers?: Record<string, string>
  fetchImpl?: typeof fetch
}

export interface ReceiptEmailAdapter {
  /** Chiede al backend di inviare un'email di riepilogo all'indirizzo indicato. Nessuno stato locale. */
  sendReceiptEmail(flowId: string, email: string, answers: Answers): Promise<void>
}

/** Adapter che chiama un endpoint REST per far inviare al backend un'email di riepilogo. */
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
        throw new Error(`Invio email fallito: ${res.status} ${res.statusText}`)
      }
    },
  }
}
