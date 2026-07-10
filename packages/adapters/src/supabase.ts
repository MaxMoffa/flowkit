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
 * Supabase stub adapter: requires a client already initialized by the consumer
 * (we don't add @supabase/supabase-js as a direct dependency of the package).
 */
export function createSupabaseAdapter(options: SupabaseAdapterOptions): FlowAdapter {
  const table = options.table ?? "flow_submissions"
  const drafts = new Map<string, Answers>()

  return {
    async submit(flowId, answers) {
      const { error } = await options.client.from(table).insert({ flow_id: flowId, answers })
      if (error) {
        throw new Error(`Supabase submission failed: ${error.message}`)
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
