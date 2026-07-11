import type { Answers } from "@flowkit-io/core"
import type { FlowAdapter } from "./types"

export interface LocalAdapterOptions {
  storage?: Storage
  namespace?: string
}

function draftKey(namespace: string, flowId: string) {
  return `${namespace}:draft:${flowId}`
}

function submissionsKey(namespace: string, flowId: string) {
  return `${namespace}:submissions:${flowId}`
}

function resultKey(namespace: string, id: string) {
  return `${namespace}:results:${id}`
}

/** Adapter that saves drafts and submissions to localStorage (or an injected compatible storage). */
export function createLocalAdapter(options: LocalAdapterOptions = {}): FlowAdapter {
  const storage = options.storage ?? (typeof window !== "undefined" ? window.localStorage : undefined)
  const namespace = options.namespace ?? "flowkit"

  if (!storage) {
    throw new Error("createLocalAdapter requires a Storage (localStorage is not available)")
  }

  return {
    async submit(flowId, answers) {
      const key = submissionsKey(namespace, flowId)
      const existing = JSON.parse(storage.getItem(key) ?? "[]") as Answers[]
      existing.push(answers)
      storage.setItem(key, JSON.stringify(existing))
      storage.removeItem(draftKey(namespace, flowId))
    },
    async loadDraft(flowId) {
      const raw = storage.getItem(draftKey(namespace, flowId))
      return raw ? (JSON.parse(raw) as Answers) : null
    },
    async saveDraft(flowId, answers) {
      storage.setItem(draftKey(namespace, flowId), JSON.stringify(answers))
    },
    async createResultLink(_flowId, answers) {
      const id = crypto.randomUUID()
      storage.setItem(resultKey(namespace, id), JSON.stringify(answers))
      const origin = typeof window !== "undefined" ? window.location.origin + window.location.pathname : ""
      return { id, url: `${origin}?result=${id}` }
    },
  }
}
