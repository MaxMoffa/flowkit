# `info`

Content-only step: title, subtitle, and [`image`](./index.md#the-image-field), same
visual structure and component chrome as [`intro`](./intro.md) (they share
`IntroLikeView` internally) — but unlike `intro`, it has no `cta`/`livePill` and no
positional constraint: it can appear anywhere in `steps[]`, any number of times.

Adds no field to the flow and no value to collected data: the component never calls
`onChange`, and the type is excluded from the review/summary step and from the final
answers payload (`includeInSummary: false`). Component: `InfoStepView`.

<StepPreview type="info" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `title` | `string` | — | Heading |
| `subtitle` | `string` | — | Markdown body (bold, italic, links, lists) |
| `image` | `{kind,value}` | — | See [the base `image` field](./index.md#the-image-field) |

## Example

```ts
{ id: "before-terms", type: "info", title: "Before you continue",
  subtitle: "Read the next screen carefully — it explains **why** we ask for this.",
  image: { kind: "emoji", value: "ℹ️" } }
```

For long, independently-scrollable content (terms & conditions, privacy notice), see
[`long-content`](./long-content.md).

[← All steps](./index.md)
