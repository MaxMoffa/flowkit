# `review`

Automatic summary of all answers given so far (excludes `intro`, `review` and
`confirmation`), with thumbnails for anything captured by a `media`/`file` step.
Component: `ReviewStepView`.

Two modes (`mode` field, default `"final"`):
- **`"final"`**: the flow's closing recap — at most one per flow, and it must sit
  immediately before `confirmation`. Its button reads "Submit report ✓" and invokes
  `FlowRunner`'s `onSubmit`.
- **`"checkpoint"`**: a partial, mid-flow recap — any number allowed, anywhere in the
  middle. Behaves like a normal step (plain "Continue", no submit).

Every summary row is clickable: tapping one jumps back to that step for editing, and
the next "Continue" (relabeled "Back to summary") snaps straight back to the review —
unless `Flow.disableBack` is set, which also disables this shortcut.

<StepPreview type="review" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `mode` | `"final" \| "checkpoint"` | `"final"` | See above |
| `meta` | `string` | — | Info banner above the summary |
| `submitLabel` | `string` | `"Invia segnalazione ✓"` | Only used by a `"final"` review — the submit button's text. Overrides the payment label below |
| `paymentSummary` | `"auto" \| "hidden"` | `"auto"` | When the flow has a [`payment-stripe`](./payment-stripe.md) step: `"auto"` shows the amount as a total callout at the top; `"hidden"` omits it |

When the flow contains a `payment-stripe` step, a `"final"` review's submit button
becomes `submitWithPayment` ("Completa pagamento e invia ✓") — because pressing it
is what actually charges the card. A rejected charge (throw from `onSubmit`) keeps
the user here and shows the error under the button.

## Example

```ts
{ id: "review", type: "review", title: "Ready to go?", subtitle: "Check and submit your report.",
  meta: "🌬️ We'll automatically add the weather and wind direction" }
```

[← All steps](./index.md)
