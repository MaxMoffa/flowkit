import type { AnswerValue, Answers } from "@flowkit/core"
import type { FlowAdapter } from "./types"

const NOTION_API_BASE = "https://api.notion.com/v1"
const NOTION_VERSION = "2022-06-28"

export interface NotionAdapterConfig {
  /** Integration token Notion, iniettato dal consumer (mai hardcoded nel pacchetto). */
  token: string
  databaseId: string
  fetchImpl?: typeof fetch
  /** Override del mapping risposte -> property Notion. Default: mapping ragionevole per tipo. */
  mapAnswersToProperties?: (answers: Answers, flowId: string) => Record<string, unknown>
}

/** Mapping di default: stringa -> rich_text, numero -> number, array -> multi_select, altro -> rich_text (JSON). */
function defaultMapAnswersToProperties(
  answers: Answers,
  flowId: string,
): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    flowId: { rich_text: [{ text: { content: flowId } }] },
    draft: { checkbox: false },
  }

  for (const [key, value] of Object.entries(answers)) {
    properties[key] = answerValueToNotionProperty(value)
  }

  return properties
}

function answerValueToNotionProperty(value: AnswerValue): unknown {
  if (value === null || value === undefined) {
    return { rich_text: [] }
  }
  if (typeof value === "number") {
    return { number: value }
  }
  if (typeof value === "boolean") {
    return { checkbox: value }
  }
  if (Array.isArray(value)) {
    return { multi_select: value.map((v) => ({ name: String(v) })) }
  }
  if (typeof value === "object") {
    return { rich_text: [{ text: { content: JSON.stringify(value) } }] }
  }
  return { rich_text: [{ text: { content: String(value) } }] }
}

/**
 * Adapter Notion: submit crea una pagina nel database Notion configurato.
 * Notion non ha un concetto nativo di "bozza": loadDraft/saveDraft operano su
 * una pagina con property `draft: true`, filtrata per `flowId` (rich_text) —
 * comportamento onesto, sempre via API Notion, nessun draft locale.
 *
 * Nessuna dipendenza dall'SDK ufficiale (@notionhq/client): chiamate REST
 * dirette via fetch, coerente con l'adapter rest.ts esistente.
 */
export function createNotionAdapter(config: NotionAdapterConfig): FlowAdapter {
  const fetchImpl = config.fetchImpl ?? fetch
  const mapAnswersToProperties = config.mapAnswersToProperties ?? defaultMapAnswersToProperties

  const headers = {
    Authorization: `Bearer ${config.token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  }

  async function findDraftPageId(flowId: string): Promise<string | null> {
    const res = await fetchImpl(`${NOTION_API_BASE}/databases/${config.databaseId}/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        filter: {
          and: [
            { property: "flowId", rich_text: { equals: flowId } },
            { property: "draft", checkbox: { equals: true } },
          ],
        },
        page_size: 1,
      }),
    })
    if (!res.ok) {
      throw new Error(`Ricerca bozza Notion fallita: ${res.status} ${res.statusText}`)
    }
    const data = (await res.json()) as { results: { id: string }[] }
    return data.results[0]?.id ?? null
  }

  return {
    async submit(flowId, answers) {
      const properties = mapAnswersToProperties(answers, flowId)
      properties.draft = { checkbox: false }

      const existingDraftId = await findDraftPageId(flowId)
      const url = existingDraftId
        ? `${NOTION_API_BASE}/pages/${existingDraftId}`
        : `${NOTION_API_BASE}/pages`
      const res = await fetchImpl(url, {
        method: existingDraftId ? "PATCH" : "POST",
        headers,
        body: JSON.stringify(
          existingDraftId
            ? { properties }
            : { parent: { database_id: config.databaseId }, properties },
        ),
      })
      if (!res.ok) {
        throw new Error(`Invio a Notion fallito: ${res.status} ${res.statusText}`)
      }
    },

    async loadDraft(flowId) {
      const pageId = await findDraftPageId(flowId)
      if (!pageId) return null
      const res = await fetchImpl(`${NOTION_API_BASE}/pages/${pageId}`, { headers })
      if (!res.ok) {
        throw new Error(`Lettura bozza Notion fallita: ${res.status} ${res.statusText}`)
      }
      const page = (await res.json()) as { properties: Record<string, unknown> }
      return notionPropertiesToAnswers(page.properties)
    },

    async saveDraft(flowId, answers) {
      const properties = mapAnswersToProperties(answers, flowId)
      properties.draft = { checkbox: true }

      const existingDraftId = await findDraftPageId(flowId)
      const url = existingDraftId
        ? `${NOTION_API_BASE}/pages/${existingDraftId}`
        : `${NOTION_API_BASE}/pages`
      const res = await fetchImpl(url, {
        method: existingDraftId ? "PATCH" : "POST",
        headers,
        body: JSON.stringify(
          existingDraftId
            ? { properties }
            : { parent: { database_id: config.databaseId }, properties },
        ),
      })
      if (!res.ok) {
        throw new Error(`Salvataggio bozza Notion fallito: ${res.status} ${res.statusText}`)
      }
    },
  }
}

/** Estrae le risposte "grezze" da un set di property Notion (best-effort, per loadDraft). */
function notionPropertiesToAnswers(properties: Record<string, unknown>): Answers {
  const answers: Answers = {}
  for (const [key, raw] of Object.entries(properties)) {
    if (key === "flowId" || key === "draft") continue
    const prop = raw as Record<string, unknown>
    if ("rich_text" in prop) {
      const arr = prop.rich_text as { plain_text?: string }[]
      answers[key] = arr.map((t) => t.plain_text ?? "").join("") || null
    } else if ("number" in prop) {
      answers[key] = (prop.number as number | null) ?? null
    } else if ("checkbox" in prop) {
      answers[key] = String(prop.checkbox)
    } else if ("multi_select" in prop) {
      const arr = prop.multi_select as { name: string }[]
      answers[key] = arr.map((o) => o.name)
    } else {
      answers[key] = null
    }
  }
  return answers
}
