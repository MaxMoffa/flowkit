# @flowkit-io/adapters

Data adapters for Flowkit flows. This package provides adapters to fetch remote options, store answers, and send completed flows to backend systems (REST, Supabase, Notion, email receipt).

## Installation and usage in this repo

This package is part of the flowkit monorepo. Install dependencies at the repo root:

```bash
npm install
```

The package is available as `@flowkit-io/adapters` in workspace imports:

```typescript
import { createRestAdapter, createLocalAdapter } from "@flowkit-io/adapters"
```

## Main exports

- **`FlowAdapter`** – Base type for all adapters. An adapter receives flow answers and can perform side effects (storage, API calls, etc.).
- **`createLocalAdapter()`** – In-memory adapter; stores answers in browser memory (for testing/demo).
- **`createRestAdapter(options)`** – HTTP adapter for sending answers to a backend REST endpoint.
- **`createSupabaseAdapter(options)`** – Supabase adapter for storing answers in a PostgreSQL table (stub; requires custom Supabase client).
- **`createNotionAdapter(config)`** – Notion adapter to append flow answers to a Notion database.
- **`createReceiptEmailAdapter(options)`** – Email adapter to send a receipt/summary email after flow submission.

## Configuration options

**LocalAdapter** – No options required:

```typescript
const adapter = createLocalAdapter()
// Stores answers in browser memory; useful for testing or progressive form states
```

**RestAdapter:**

```typescript
const adapter = createRestAdapter({
  url: "https://api.example.com/flows/submit",     // Endpoint URL
  method: "POST",                                   // HTTP method (default: POST)
  headers: {                                         // Optional HTTP headers
    "Authorization": "Bearer your-api-key",
    "Content-Type": "application/json",
  },
  transformPayload?: (answers, report) => any      // Optional: transform answers before sending
  includeReport?: boolean,                          // Include flow metadata in payload (default: true)
})
```

The adapter sends a JSON payload:

```json
{
  "answers": {
    "step_key_1": "value1",
    "step_key_2": ["value2a", "value2b"],
    ...
  },
  "report": {
    "flowId": "my-flow",
    "flowTitle": "My Flow",
    "submittedAt": "2024-01-15T10:30:00Z",
    "stepCount": 5,
    "answers": { ... }
  }
}
```

**SupabaseAdapter** (stub):

```typescript
import { createSupabaseAdapter } from "@flowkit-io/adapters"

const adapter = createSupabaseAdapter({
  client: supabaseClient,    // Instance of @supabase/supabase-js
  table: "flow_answers",     // Table name
  flowIdColumn: "flow_id",   // Column for flow ID
  answersColumn: "answers",  // Column to store answers (JSON)
})
```

Requires a Supabase client instance and a target table. Answers are stored as JSONB.

**NotionAdapter:**

```typescript
const adapter = createNotionAdapter({
  notionApiKey: "secret_...",        // Notion API token (from integration)
  databaseId: "abc123...",           // Notion database ID
  fieldMappings: {                   // Map answer keys to Notion properties
    email: "Email",                  // step key → Notion property name
    topic: "Topic",
  },
  flowNameProperty: "Flow",          // Notion property for flow name
})
```

Requires a Notion API token and database ID. Field mappings connect step keys to Notion database property names.

**ReceiptEmailAdapter:**

```typescript
const adapter = createReceiptEmailAdapter({
  smtpServer: "smtp.example.com",     // SMTP server
  smtpPort: 587,                      // SMTP port (default: 587)
  smtpUser: "noreply@example.com",    // SMTP username
  smtpPassword: "password",            // SMTP password
  fromAddress: "noreply@example.com", // From email address
  fromName: "My App",                 // Sender name
  recipientField: "email",            // Step key containing recipient email
  subject?: "Your Feedback Submitted", // Email subject
  renderTemplate?: (answers, report) => string  // Custom HTML template
})
```

Sends a confirmation email after flow submission. By default, uses @flowkit-io/react's `renderReceiptEmailHtml()` unless a custom template is provided.

## Basic example

```typescript
import { parseFlow } from "@flowkit-io/core"
import { FlowRunner } from "@flowkit-io/react"
import { createRestAdapter } from "@flowkit-io/adapters"

const myFlow = parseFlow({
  id: "feedback",
  steps: [
    {
      id: "email",
      type: "text",
      key: "email_address",
      title: "Your email",
      variant: "email",
    },
    {
      id: "message",
      type: "notes",
      key: "feedback_text",
      title: "Your feedback",
    },
    {
      id: "confirmation",
      type: "confirmation",
      title: "Thank you!",
    },
  ],
})

// Create an adapter to send answers to your backend
const adapter = createRestAdapter({
  url: "https://api.example.com/flows/feedback",
  headers: { "Authorization": "Bearer my-token" },
})

export function App() {
  const handleSubmit = async (answers) => {
    // The adapter receives the answers
    await adapter.submit(answers, { flowId: "feedback" })
    // Then forward to your own backend if needed
    await fetch("https://api.example.com/my-endpoint", {
      method: "POST",
      body: JSON.stringify(answers),
    })
  }

  return (
    <FlowRunner
      flow={myFlow}
      onSubmit={handleSubmit}
    />
  )
}
```

## Remote data sources in steps

Adapters also enable fetching dynamic options for select-style steps. Configure a `dataSource` in a step:

```typescript
{
  type: "multi-select",
  key: "departments",
  title: "Select departments",
  dataSource: {
    url: "https://api.example.com/departments",
    labelField: "name",                  // JSON response field for display label
    valueField: "id",                    // JSON response field for value
    method: "GET",
    headers: { "Authorization": "Bearer token" },
    dependsOn: ["region"],               // Refetch if "region" answer changes
    debounce: 300,                       // Debounce search input (ms)
  },
}
```

The endpoint must return an array of objects:

```json
[
  { "id": "dept-1", "name": "Engineering", ... },
  { "id": "dept-2", "name": "Sales", ... }
]
```

## Development and test commands

From the package directory:

```bash
npm run build          # Build with tsup (ESM + TypeScript declarations)
```

From the repo root:

```bash
npm run lint           # Lint all packages
npm run typecheck      # Type-check all packages
npm run test           # Run all tests (unit + integration)
npm run verify:fast    # lint + typecheck + test + build (no e2e)
npm run verify         # lint + typecheck + test + build + e2e
```

## Compatibility and dependencies

- **Runtime:** Node.js 18+ (module: ESM)
- **TypeScript:** 5.0+
- **Dependencies:**
  - **@flowkit-io/core** ^0.13.0 – Flow schema and types
- **Peer dependencies:** None (Supabase, Notion, SMTP clients are optional, install as needed)
- **Internal workspace dependencies:**
  - @flowkit-io/core

## Notes

- Adapters are **optional**: flows work fine without them. The `onSubmit` handler in `FlowRunner` receives answers and can forward them anywhere.
- The **LocalAdapter** is useful for testing and progressive state management but does not persist answers across page reloads.
- The **RestAdapter** is the most common; it sends answers to your backend via HTTP. Transform the payload with `transformPayload` if your API expects a different structure.
- The **SupabaseAdapter** is a stub; you provide a Supabase client and table configuration.
- The **NotionAdapter** requires a Notion API token and database; field mappings connect step keys to Notion property names (case-sensitive).
- The **ReceiptEmailAdapter** requires SMTP credentials; it's often used alongside another adapter (e.g., RestAdapter) to both store answers and send a confirmation email.
- Remote data sources retry on error (network timeout, 5xx response) and debounce rapid changes to avoid flooding the backend.
- All adapters receive the full answers object and an optional `Report` object with flow metadata (flowId, submittedAt, etc.).
