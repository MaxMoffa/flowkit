# Persisting answers (adapters)

`@flowkit-io/adapters` exposes the same interface (`FlowAdapter`) for four different
backends:

```ts
export interface FlowAdapter {
  submit(flowId: string, answers: Answers): Promise<void>
  loadDraft(flowId: string): Promise<Answers | null>
  saveDraft(flowId: string, answers: Answers): Promise<void>
  /** Optional: persists the answers with a unique id and returns a shareable link.
   *  Implemented by createLocalAdapter and createRestAdapter; used by
   *  confirmation's resultActions.resultLink. */
  createResultLink?(flowId: string, answers: Answers): Promise<{ id: string; url: string }>
}
```

## `createLocalAdapter` — localStorage

```ts
import { createLocalAdapter } from "@flowkit-io/adapters"

const adapter = createLocalAdapter({
  namespace: "flowkit-playground", // storage key prefix, default "flowkit"
  storage: window.localStorage,     // optional, to inject a compatible Storage (e.g. in tests)
})
```

## `createRestAdapter` — HTTP endpoint

```ts
import { createRestAdapter } from "@flowkit-io/adapters"

const adapter = createRestAdapter({
  baseUrl: "https://api.your-domain.com",
  headers: { Authorization: "Bearer ..." }, // optional
  fetchImpl: myFetch,                        // optional, default global fetch
})
```

`submit` does `POST ${baseUrl}/flows/${flowId}/submissions`. Drafts stay in memory only
(not persisted server-side). `createResultLink` does
`POST ${baseUrl}/flows/${flowId}/results`, expecting a JSON `{ id, url }` response from
your backend.

## `createSupabaseAdapter` — Supabase stub

```ts
import { createSupabaseAdapter } from "@flowkit-io/adapters"
import { createClient } from "@supabase/supabase-js"

const client = createClient(url, key)
const adapter = createSupabaseAdapter({ client, table: "flow_submissions" /* default */ })
```

The package **does not depend on** `@supabase/supabase-js`: you pass in an already
initialized client that satisfies the minimal `SupabaseClientLike` interface.

## `createNotionAdapter` — pages in a Notion database

```ts
import { createNotionAdapter } from "@flowkit-io/adapters"

const adapter = createNotionAdapter({
  token: process.env.NOTION_TOKEN!,   // integration token, never hardcoded
  databaseId: "your-database-id",
  mapAnswersToProperties: (answers, flowId) => ({ /* custom mapping, optional */ }),
})
```

`submit` creates (or updates, if a draft exists) a page in the configured Notion
database, via direct REST calls (no dependency on `@notionhq/client`). Default
mapping: string → `rich_text`, number → `number`, array → `multi_select`, anything
else → JSON in `rich_text`. Notion has no native concept of a draft: `loadDraft`/
`saveDraft` operate on a page with a boolean `draft` property, filtered by a `flowId`
(rich_text) property — no local storage, every read/write goes through the Notion API.
The target Notion database must have (at least) the `flowId` (text) and `draft`
(checkbox) properties, plus a property for each answer you want to map (or a custom
`mapAnswersToProperties`).

## Writing a custom adapter

```ts
import type { FlowAdapter } from "@flowkit-io/adapters"

export function createMyAdapter(): FlowAdapter {
  return {
    async submit(flowId, answers) { /* ... */ },
    async loadDraft(flowId) { return null },
    async saveDraft(flowId, answers) { /* ... */ },
  }
}
```

Back to the [docs index](./README.md).
