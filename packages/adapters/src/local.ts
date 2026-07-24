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

/** A hand-edited or cross-version-corrupted entry must not take down the whole flow:
 *  an unreadable value is treated as "nothing stored yet". */
function readJson<T>(storage: Storage, key: string, fallback: T): T {
  const raw = storage.getItem(key)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Storage writes throw on quota overflow and in some private-browsing modes. Losing a
 *  draft is recoverable, so the write is best-effort and reports whether it landed. */
function writeJson(storage: Storage, key: string, value: unknown): boolean {
  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
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
      const existing = readJson<Answers[]>(storage, key, [])
      existing.push(answers)
      // A lost submission is not recoverable, so this one failure is surfaced.
      if (!writeJson(storage, key, existing)) {
        throw new Error("createLocalAdapter: could not store the submission (storage full or unavailable)")
      }
      storage.removeItem(draftKey(namespace, flowId))
    },
    async loadDraft(flowId) {
      return readJson<Answers | null>(storage, draftKey(namespace, flowId), null)
    },
    async saveDraft(flowId, answers) {
      // Autosave: a failed write must not interrupt the user mid-flow.
      writeJson(storage, draftKey(namespace, flowId), answers)
    },
    async createResultLink(_flowId, answers) {
      const id = crypto.randomUUID()
      // The returned URL would point at nothing if the write failed.
      if (!writeJson(storage, resultKey(namespace, id), answers)) {
        throw new Error("createLocalAdapter: could not store the result (storage full or unavailable)")
      }
      const origin = typeof window !== "undefined" ? window.location.origin + window.location.pathname : ""
      return { id, url: `${origin}?result=${id}` }
    },
  }
}
