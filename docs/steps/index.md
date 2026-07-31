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
| `image` | `{kind,value}` | — | The step's own badge/icon (also used as the `review` row icon; defaults by `type` if absent) — see below |
| `key` | `string` (`[a-z0-9_]+`) | slug of `title`, else of `id` | Technical field name used in collected data (`Answers`, export/integration payloads) — distinct from `id`. Set it explicitly to override the auto-generated slug, or to name a titleless step. Must be unique across the whole flow (including nested `group` children); a duplicate throws at `parseFlow()` time. |
| `themeOverride` | object (subset of theme tokens) | — | Overrides theme tokens only while this step is shown — see [Theming](../theming.md) |

### The `image` field

A discriminated union — `kind` picks how `value` is interpreted, no picker ships with
the library, so a consumer authors `value` itself:

| `kind` | `value` is... | Rendered as |
|---|---|---|
| `"emoji"` | a literal emoji character | plain text |
| `"icon"` | raw inline SVG markup | sanitized (`@flowkit-io/react` uses DOMPurify) and mounted inline, so it inherits `currentColor` and adapts to light/dark themes |
| `"image"` | a URL or `data:` URI (raster or SVG) | an `<img>` |

`stepImageSchema` (core) only validates the shape above — zod runs with no DOM access,
so it can't sanitize markup. Actual SVG sanitization for `kind: "icon"` happens
exclusively on the `@flowkit-io/react` side (`<StepImage>`, and the
`renderAnswersReportHtml`/receipt-email string exporters that embed the same markup).
A consumer rendering `image` values outside `@flowkit-io/react` must sanitize
`kind: "icon"` markup itself before mounting it.

### Branching

The order of `steps[]` is the default navigation order, but a
[`branch`](./branch.md) step (invisible, evaluated and resolved before it would ever
render) can jump forward to any other step's `id` based on prior answers —
see [`branch`](./branch.md) for the condition syntax.

## By category

**Structure** — [`intro`](./intro.md) (must be first) · [`review`](./review.md) ·
[`confirmation`](./confirmation.md) (must be last) · [`group`](./group.md)

**Content only** — [`info`](./info.md) · [`long-content`](./long-content.md)

**Logic** — [`branch`](./branch.md) (invisible, conditional navigation)

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
| [`info`](./info.md) | — | Content-only, same look as `intro`; repeatable, no positional constraint |
| [`long-content`](./long-content.md) | — | Long scrollable content (terms, privacy); optional scroll-to-end gate |
| [`branch`](./branch.md) | — | Invisible; resolves conditional navigation, never rendered |

[Back to docs index](../README.md)
