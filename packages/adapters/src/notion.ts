import type { AnswerValue, Answers } from "@flowkit-io/core"
import type { FlowAdapter } from "./types"

const NOTION_API_BASE = "https://api.notion.com/v1"
const NOTION_VERSION = "2022-06-28"

export interface NotionAdapterConfig {
  /** Notion integration token, injected by the consumer (never hardcoded in the package). */
  token: string
  databaseId: string
  fetchImpl?: typeof fetch
  /** Override for the answers -> Notion property mapping. Default: a reasonable mapping per type. */
  mapAnswersToProperties?: (answers: Answers, flowId: string) => Record<string, unknown>
}

/** Default mapping: string -> rich_text, number -> number, array -> multi_select, other -> rich_text (JSON). */
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
 * Notion adapter: submit creates a page in the configured Notion database.
 * Notion has no native concept of a "draft": loadDraft/saveDraft operate on
 * a page with a `draft: true` property, filtered by `flowId` (rich_text) —
 * honest behavior, always via the Notion API, no local draft.
 *
 * No dependency on the official SDK (@notionhq/client): direct REST calls
 * via fetch, consistent with the existing rest.ts adapter.
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
      throw new Error(`Notion draft search failed: ${res.status} ${res.statusText}`)
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
        throw new Error(`Notion submission failed: ${res.status} ${res.statusText}`)
      }
    },

    async loadDraft(flowId) {
      const pageId = await findDraftPageId(flowId)
      if (!pageId) return null
      const res = await fetchImpl(`${NOTION_API_BASE}/pages/${pageId}`, { headers })
      if (!res.ok) {
        throw new Error(`Notion draft read failed: ${res.status} ${res.statusText}`)
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
        throw new Error(`Notion draft save failed: ${res.status} ${res.statusText}`)
      }
    },
  }
}

/** Extracts "raw" answers from a set of Notion properties (best-effort, for loadDraft). */
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
