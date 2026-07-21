# Sending answers via email

The `confirmation` step accepts an optional field:

```ts
emailShare?: {
  enabled: boolean          // default false — no button if absent/false
  subject?: string          // email subject, defaults to the confirmation's title
  buttonLabel?: string      // default "Send via email"
  helpText?: string         // descriptive line above the email field
}
```

If `enabled: true`, the confirmation screen shows an email field + button: on click,
the component builds a `mailto:<email>?subject=...&body=...` link with the body
generated from **all the flow's answers** (`answers`) and opens the user's default
mail client. Answers coming from a `media`/`file` step are summarized as an attachment
count (e.g. "3 allegato/i"), not embedded as base64 data — that wouldn't make sense in
a `mailto:` body.

There's no server-side sending: it's up to the end user to choose whether and how to
complete the send from their own client.

```ts
{
  id: "confirmation",
  type: "confirmation",
  title: "Thank you!",
  emailShare: {
    enabled: true,
    subject: "My smell report",
    buttonLabel: "Send via email",
    helpText: "Want to keep a copy of your report? Get it via email.",
  },
}
```

## Other result actions (`resultActions`)

Besides `emailShare` (mailto), the `confirmation` step accepts an optional
`resultActions` field with four independent actions, each enabled separately and
coexisting with one another:

```ts
resultActions?: {
  pdfExport?: {
    enabled: boolean
    buttonLabel?: string       // default "Download PDF"
    documentTitle?: string     // title shown in the printed document
  }
  resultLink?: {
    enabled: boolean
    buttonLabel?: string       // default "Copy link"
    helpText?: string
    createLink: (answers) => Promise<{ url: string }>
  }
  nativeShare?: {
    enabled: boolean
    buttonLabel?: string       // default "Share"
    shareTitle?: string
  }
  emailApi?: {
    enabled: boolean
    buttonLabel?: string       // default "Send via email (server)"
    helpText?: string
    sendEmail: (email, answers) => Promise<void>
  }
}
```

- **`pdfExport`**: no extra dependency. The button calls `window.print()` on a
  dedicated summary (`.fk-print-recap`), styled with the same `.fk-review-box`/
  `.fk-review-row` markup as the `review` step (icon + title + value per answer,
  including real `<img>` thumbnails for any image captured by a `media`/`file` step) —
  the user chooses "Save as PDF" from the browser's print dialog.
- **`nativeShare`**: uses the browser's
  [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
  (`navigator.share`); the button is only shown if the API is available
  (feature-detected), no custom fallback.
- **`resultLink`** and **`emailApi`** require a function injected into the config
  (`createLink`/`sendEmail`): this keeps `@flowkit-io/react` decoupled from
  `@flowkit-io/adapters` (same pattern as the Notion adapter's `mapAnswersToProperties`
  callback). **Limitation**: being functions, these two fields aren't
  JSON-serializable — a flow using them must be built as a TS/JS object, not loaded
  from plain JSON.

```ts
import { createLocalAdapter, createReceiptEmailAdapter } from "@flowkit-io/adapters"

const adapter = createLocalAdapter({ namespace: "my-app" })
const receiptEmailAdapter = createReceiptEmailAdapter({ baseUrl: "/api" })

// in the confirmation step's config:
resultActions: {
  pdfExport: { enabled: true },
  nativeShare: { enabled: true },
  resultLink: {
    enabled: true,
    createLink: (answers) => adapter.createResultLink!("my-flow", answers),
  },
  emailApi: {
    enabled: true,
    sendEmail: (email, answers) => receiptEmailAdapter.sendReceiptEmail("my-flow", email, answers),
  },
}
```

`createReceiptEmailAdapter` calls `POST {baseUrl}/flows/{flowId}/receipt-email` with
body `{ email, answers }`: your backend is the one that actually sends the email. As a
starting point for the HTML to send, `@flowkit-io/react` exports
`renderReceiptEmailHtml({ title, message?, answers })`, a template with inline styles
matching the notion-clean look (images from `media`/`file` answers are inlined as
`<img>` tags when present) — a reference function for the consumer's backend, not
called from any client-side code in this repo.

## Generating a styled report outside the built-in UI

`@flowkit-io/react` also exports `renderAnswersReportHtml(flow, answers, options?)`: a
public method that generates the exact same `.fk-review-box` styled report (icon +
title + value per answer, with real image thumbnails for `media`/`file` answers) as a
standalone HTML string — independent of the `confirmation` step's built-in PDF/share
buttons. Use it to build your own export/share flow (e.g. attach it to a custom email,
render it in your own page, save it as a static snapshot):

```ts
import { renderAnswersReportHtml } from "@flowkit-io/react"

const html = renderAnswersReportHtml(myFlow, answers, { documentTitle: "My report" })
// html is a `.fk-review-box`/`.fk-review-list` fragment: the consumer's page must also
// load @flowkit-io/react/style.css (or render inside a `.fk-theme` scope) for it to be
// styled.
```

The underlying row-building logic (`buildReportRows`, `formatAnswer`, `defaultIcon`) is
also exported from `@flowkit-io/core` as framework-agnostic data (`{ icon, title, value,
media? }[]`, no HTML) — usable to build a differently-rendered report (e.g. a PDF
generated server-side, or a future non-React renderer) without duplicating the
answer-formatting rules.

Back to the [docs index](./README.md).
