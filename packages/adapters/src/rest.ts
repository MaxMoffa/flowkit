import type { Answers } from "@flowkit-io/core"
import type { FlowAdapter } from "./types"
import { requestJson } from "./http"

export interface RestAdapterOptions {
  baseUrl: string
  headers?: Record<string, string>
  fetchImpl?: typeof fetch
}

/** Adapter that submits answers to a REST endpoint. Drafts stay in memory only. */
export function createRestAdapter(options: RestAdapterOptions): FlowAdapter {
  const drafts = new Map<string, Answers>()
  const jsonHeaders = { "Content-Type": "application/json", ...options.headers }

  return {
    async submit(flowId, answers) {
      await requestJson(`${options.baseUrl}/flows/${flowId}/submissions`, "Submission failed", {
        headers: jsonHeaders,
        body: answers,
        fetchImpl: options.fetchImpl,
      })
      drafts.delete(flowId)
    },
    async loadDraft(flowId) {
      return drafts.get(flowId) ?? null
    },
    async saveDraft(flowId, answers) {
      drafts.set(flowId, answers)
    },
    async createResultLink(flowId, answers) {
      const res = await requestJson(`${options.baseUrl}/flows/${flowId}/results`, "Link creation failed", {
        headers: jsonHeaders,
        body: answers,
        fetchImpl: options.fetchImpl,
      })
      return (await res.json()) as { id: string; url: string }
    },
  }
}
