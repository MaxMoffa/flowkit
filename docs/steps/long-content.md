# `long-content`

Variant of [`info`](./info.md) for long, scrollable text — terms & conditions, a
privacy notice. The `content` markdown body renders full-width, in its own
independently-scrollable region: the flow's chrome (header/footer, navigation)
stays fixed and always visible below it, only the content scrolls. Same
content-only contract as `info`: no field added to the flow, no value in
collected data (`includeInSummary: false`). Component: `LongContentStepView`.

<StepPreview type="long-content" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `title` | `string` | — | Heading, stays fixed above the scroll region |
| `subtitle` | `string` | — | Markdown, stays fixed above the scroll region |
| `content` | `string` | — (required) | Markdown body (bold, italic, links, lists), the scrollable part |
| `requireScrollToEnd` | `boolean` | `false` | When `true`, the flow's "Continue" stays disabled until the user has scrolled `content` to the bottom |

`requireScrollToEnd` doesn't store an answer — it gates `canGoNext` through the
step's own ephemeral per-step state (the same channel `FlowState.meta` already
uses for e.g. the `smartFill` add-on), not the collected `Answers`.

## Example

```ts
{ id: "terms", type: "long-content", title: "Terms & Conditions",
  requireScrollToEnd: true,
  content: "**By continuing you agree to...**\n\n- point one\n- point two\n\n[Full text](https://example.com/terms)" }
```

[← All steps](./index.md)
