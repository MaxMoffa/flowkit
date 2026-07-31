# Step reference

Every step type registered out of the box. Runtime source of truth:
`listRegisteredStepTypes()` (a step registered at runtime via `registerStepType`/
`registerStepComponent` — see [Custom steps](../custom-steps.md) — works exactly the
same way, it just won't appear in this static list).

## Fields common to every step

Every object in `steps[]` — whatever its `type` — accepts these base fields:

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | — (required) | Unique step identifier within the flow; key in `Answers` |
| `type` | `string` | — (required) | Determines the extra schema and component used, resolved at runtime by the registry |
| `title` | `string` | — | Title (`<h1>`/`<h2>` depending on the step) |
| `subtitle` | `string` | — | Subtitle/description under the title |
| `required` | `boolean` | `true` | If `false`, the step always validates — "Continue" doesn't wait for an answer |
| `icon` | `string` (emoji) | — | Icon shown in the `review` step's summary row (defaults by `type` if absent) |
| `themeOverride` | object (subset of theme tokens) | — | Overrides theme tokens only while this step is shown — see [Theming](../theming.md) |

The order of `steps[]` is the navigation order. There's no conditional/branching step —
compose different flows and pick which one to mount at runtime instead (see the
playground's Preset selector).

## By category

**Structure** — [`intro`](./intro.md) (must be first) · [`review`](./review.md) ·
[`confirmation`](./confirmation.md) (must be last) · [`group`](./group.md)

**Choice** — [`select-cards`](./select-cards.md) · [`chips`](./chips.md) ·
[`radio`](./radio.md) · [`multi-select`](./multi-select.md) · [`faces`](./faces.md)

**Rating** — [`scale`](./scale.md) · [`nps`](./nps.md)

**Text & input** — [`text`](./text.md) · [`checkbox`](./checkbox.md) ·
[`date-time`](./date-time.md) · [`booking-slot`](./booking-slot.md) ·
[`notes`](./notes.md)

**Media** — [`media`](./media.md) · [`file`](./file.md) ·
[`media-display`](./media-display.md) · [`signature`](./signature.md)

**Location** — [`location`](./location.md) (maplibre) ·
[`location-leaflet`](./location-leaflet.md) (leaflet)

**Integrations** — [`oauth`](./oauth.md) · [`payment-stripe`](./payment-stripe.md) ·
[`verification`](./verification.md) (Turnstile/reCAPTCHA)

## All step types

| Type | Answer value | Notes |
|---|---|---|
| [`intro`](./intro.md) | — | Hero screen, first step of every flow |
| [`location`](./location.md) | `{lat,lng,address?}` | Real map (maplibre-gl), opt-in |
| [`location-leaflet`](./location-leaflet.md) | `{lat,lng,address?}` | Same as `location`, leaflet renderer, opt-in |
| [`select-cards`](./select-cards.md) | `string \| string[]` | Card grid, remote `dataSource` supported |
| [`scale`](./scale.md) | `number` | Pills or slider |
| [`chips`](./chips.md) | `string \| string[]` | Wrapping pill row, remote `dataSource` supported |
| [`faces`](./faces.md) | `string` | Emoji hedonic scale |
| [`notes`](./notes.md) | `string` | Free textarea |
| [`media`](./media.md) | `UploadedItem[]` | Image/video capture & upload |
| [`file`](./file.md) | `UploadedItem[]` | Generic file upload |
| [`date-time`](./date-time.md) | `string` | Native date/time input |
| [`booking-slot`](./booking-slot.md) | `{start,durationMinutes,timezone}` | Two-level date+slot picker |
| [`nps`](./nps.md) | `number` | Net Promoter Score 0–10 |
| [`multi-select`](./multi-select.md) | `string[]` | Checklist, min/max |
| [`radio`](./radio.md) | `string` | Single-select list |
| [`text`](./text.md) | `string` | Text/number/email, regex `pattern`, SmartFill |
| [`checkbox`](./checkbox.md) | `boolean` | Single consent toggle |
| [`oauth`](./oauth.md) | provider-specific | OAuth redirect, PKCE |
| [`review`](./review.md) | — | Auto-summary, final or checkpoint |
| [`confirmation`](./confirmation.md) | — | Closing screen, last step of every flow |
| [`group`](./group.md) | `{[childId]: value}` | Multiple steps on one page |
| [`signature`](./signature.md) | `data:image/png;base64,...` | Canvas signature pad |
| [`payment-stripe`](./payment-stripe.md) | `{status,paymentIntentId?}` | Stripe Payment Element, opt-in |
| [`verification`](./verification.md) | `{verified,token?,provider}` | Turnstile/reCAPTCHA, opt-in |
| [`media-display`](./media-display.md) | — | Read-only image/video, no answer |

[Back to docs index](../README.md)
