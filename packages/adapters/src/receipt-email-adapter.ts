import type { Answers } from "@flowkit-io/core"
import { requestJson } from "./http"

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
  const jsonHeaders = { "Content-Type": "application/json", ...options.headers }

  return {
    async sendReceiptEmail(flowId, email, answers) {
      await requestJson(`${options.baseUrl}/flows/${flowId}/receipt-email`, "Email send failed", {
        headers: jsonHeaders,
        body: { email, answers },
        fetchImpl: options.fetchImpl,
      })
    },
  }
}
