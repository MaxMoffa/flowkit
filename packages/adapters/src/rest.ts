import type { Answers } from "@flowkit/core"
import type { FlowAdapter } from "./types"

export interface RestAdapterOptions {
  baseUrl: string
  headers?: Record<string, string>
  fetchImpl?: typeof fetch
}

/** Adapter che invia le risposte a un endpoint REST. Le bozze restano solo in memoria. */
export function createRestAdapter(options: RestAdapterOptions): FlowAdapter {
  const fetchImpl = options.fetchImpl ?? fetch
  const drafts = new Map<string, Answers>()

  return {
    async submit(flowId, answers) {
      const res = await fetchImpl(`${options.baseUrl}/flows/${flowId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...options.headers },
        body: JSON.stringify(answers),
      })
      if (!res.ok) {
        throw new Error(`Invio fallito: ${res.status} ${res.statusText}`)
      }
      drafts.delete(flowId)
    },
    async loadDraft(flowId) {
      return drafts.get(flowId) ?? null
    },
    async saveDraft(flowId, answers) {
      drafts.set(flowId, answers)
    },
    async createResultLink(flowId, answers) {
      const res = await fetchImpl(`${options.baseUrl}/flows/${flowId}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...options.headers },
        body: JSON.stringify(answers),
      })
      if (!res.ok) {
        throw new Error(`Creazione link fallita: ${res.status} ${res.statusText}`)
      }
      return (await res.json()) as { id: string; url: string }
    },
  }
}
