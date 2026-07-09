import type { Answers } from "@flowkit/core"
import type { FlowAdapter } from "./types"

export interface SupabaseClientLike {
  from(table: string): {
    insert(row: Record<string, unknown>): Promise<{ error: { message: string } | null }>
  }
}

export interface SupabaseAdapterOptions {
  client: SupabaseClientLike
  table?: string
}

/**
 * Stub adapter per Supabase: richiede un client già inizializzato dal consumer
 * (non aggiungiamo @supabase/supabase-js come dipendenza diretta del pacchetto).
 */
export function createSupabaseAdapter(options: SupabaseAdapterOptions): FlowAdapter {
  const table = options.table ?? "flow_submissions"
  const drafts = new Map<string, Answers>()

  return {
    async submit(flowId, answers) {
      const { error } = await options.client.from(table).insert({ flow_id: flowId, answers })
      if (error) {
        throw new Error(`Invio Supabase fallito: ${error.message}`)
      }
      drafts.delete(flowId)
    },
    async loadDraft(flowId) {
      return drafts.get(flowId) ?? null
    },
    async saveDraft(flowId, answers) {
      drafts.set(flowId, answers)
    },
  }
}
