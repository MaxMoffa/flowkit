# Defining a flow

A `Flow` is built with `parseFlow` (validates with zod and applies defaults):

```ts
import { parseFlow, type Flow } from "@flowkit-io/core"

export const myFlow: Flow = parseFlow({
  id: "my-flow",       // unique id, used by adapters to group answers
  title: "My flow", // title, e.g. shown in the playground's status bar
  locale: "it",          // optional, default "it"
  steps: [
    /* ... */
  ],
})
```

`parseFlow` throws a descriptive error if a `type` isn't registered, or a `ZodError` if
the config doesn't match the type's schema: always use it at build/flow-definition time
(not on arbitrary untrusted runtime input).

## Fields common to every step

Every object in `steps[]` — whatever its `type` — accepts these base fields:

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | — (required) | Unique step identifier within the flow; key in `Answers` |
| `type` | `string` | — (required) | Determines the extra schema and component used, resolved at runtime by the registry |
| `title` | `string` | — | Title (`<h1>`/`<h2>` depending on the step) |
| `subtitle` | `string` | — | Subtitle/description under the title |
| `required` | `boolean` | `true` | If `false`, the step is always considered valid: the "Continue" button doesn't block waiting for an answer |
| `icon` | `string` (emoji) | — | Icon shown in the `review` step's summary row (if absent, a default icon is used based on `type`) |
| `themeOverride` | object (subset of theme tokens) | — | Overrides some theme tokens (colors, radii, images) only while this step is shown, e.g. `{ accent: "#E56458" }`. See [Configuring a theme](./theming.md) |

The order of `steps[]` is the navigation order. There's no concept of a
conditional/branching step: if you need that, compose different flows and choose which
one to mount at runtime (as the playground does with its Preset selector).

## Reference by step type

#### `intro`

Initial "hero" screen, no header/progress bar. Component: `IntroStepView`.

| Field | Type | Default | Notes |
|---|---|---|---|
| `emoji` | `string` | — | Emoji shown in a rounded badge above the title |
| `cta` | `string` | `"Start"` | Primary button text in the footer |
| `livePill` | `string` | — | If present, shows a pill with an animated green dot above the badge (e.g. "34 reports today nearby") |

```ts
{ id: "intro", type: "intro", title: "What's in the air?", subtitle: "Report it in 30 seconds.",
  emoji: "👃", cta: "Report a smell →", livePill: "34 reports today nearby" }
```

#### `location`

Captures a geographic position on a **real map** (maplibre-gl). Answer value:
`{ lat, lng, address?, regionId?, pointId? }` (or `string`, for backward compatibility
with flows written before v2.8). Component: `LocationStepView`. See the dedicated
[Map step](./map-step.md) section for the full config (`selectionMode`, map style,
geocoding).

| Field | Type | Default | Notes |
|---|---|---|---|
| `placeholder` | `string` | `"Search an address"` | Address search bar placeholder |
| `showMap` | `boolean` | `true` | Shows/hides the map. If `false`, the position can only be set via search and/or GPS (`selectionMode` is ignored) |
| `showSearch` | `boolean` | `true` | Shows/hides the address search bar |
| `enableGps` | `boolean` | `true` | Shows/hides the "use my location" button, rendered below the map with neutral (non-accent) styling |
| `gpsButtonLabel` | `string` | `"Use my location"` | GPS button text |
| `gpsGuideTitle`/`gpsGuideText` | `string` | default text | Title/text of the help popup shown when the geolocation permission is denied/blocked |
| `enableReverseGeocode` | `boolean` | `true` | After GPS/click/drag on the map, automatically resolves the coordinates into a human-readable address (Nominatim `/reverse` or a custom endpoint); if `false` or the request fails, falls back to "lat, lng" |
| `reverseGeocodingEndpoint` | `string` | public Nominatim `/reverse` endpoint | Reverse geocoding endpoint, replaceable |
| `detectedSubLabel` | `string` | — | Secondary line under the selected address/coordinates |
| `styleUrl` | `string` | public maplibre demo style | Map style URL, replaceable |
| `geocodingEndpoint` | `string` | public Nominatim `/search` endpoint | Place (forward) search endpoint, replaceable (e.g. self-hosted server) |
| `selectionMode` | see [Map step](./map-step.md) | `{ kind: "point" }` | What "selecting" means on the map (ignored if `showMap: false`) |
| `initialCenter` | `{ lat, lng, zoom? }` | Rome, zoom 11 | Initial map center/zoom |
| `extraMarkers` | `{ lat, lng, label? }[]` | — | Additional decorative, non-selectable markers |
| `fullContainer` | `boolean` | `false` | Map fills the entire step viewport, edge-to-edge; title/subtitle/search collapse into a floating scrim bar on top, and the GPS button/result/errors collapse into a floating card at the bottom. Also available on `location-leaflet`. |

`showMap`, `showSearch` and `enableGps` are independent: combine them however you like
(search-only, map-only, GPS-only, or any combination) to adapt the step to different
cases without having to choose among several step types.

On desktop (≥1024px), a `location`/`location-leaflet` step not using `fullContainer`
automatically switches to a 2-column layout: search/GPS/result controls on the left,
map on the right, both columns matching height — no config needed, it's chrome-level
responsiveness.

```ts
{ id: "location", type: "location", title: "Where do you smell it?",
  subtitle: "Search an address or click directly on the map." }

// GPS-only, no map or search:
{ id: "location-gps-only", type: "location", showMap: false, showSearch: false }

// Map fills the whole step, controls float on top:
{ id: "location-full", type: "location", fullContainer: true }
```

#### `select-cards`

2-column grid of selectable cards (with emoji + label + optional description). Answer
value: `string` (single) or `string[]` (`multiple: true`). Component:
`SelectCardsStepView`.

| Field | Type | Default | Notes |
|---|---|---|---|
| `multiple` | `boolean` | `false` | Single or multiple selection |
| `options` | `{ value, label, emoji?, description? }[]` | — (min 1) | Grid options |

Validation: if `multiple`, requires at least one item; otherwise a non-empty string.

```ts
{ id: "smell-type", type: "select-cards", title: "What type of smell?", multiple: false,
  options: [
    { value: "sewage", label: "Sewage", emoji: "🥚", description: "Rotten eggs, sulfur" },
    { value: "chemical", label: "Chemical", emoji: "🧪", description: "Solvents, paint" },
  ] }
```

#### `scale`

Numeric rating over a range. Answer value: `number`. Component: `ScaleStepView`. Two
visual variants:

| Field | Type | Default | Notes |
|---|---|---|---|
| `min` / `max` | `number` | `1` / `5` | Range bounds (inclusive) |
| `minLabel` / `maxLabel` | `string` | — | Labels at the extremes (below the pills or the slider) |
| `variant` | `"pills" \| "slider"` | `"pills"` | `"pills"`: a row of numbered buttons, one per value. `"slider"`: `input[type=range]` with a large number and colored label above (auto-initialized to the middle value `(min+max)/2` on mount) |
| `valueLabels` | `string[]` | — | (`slider` only) text label for each value, indexed from `0` to `max-min` |
| `valueColors` | `string[]` | — | (`slider` only) CSS color for each value, same indexing as `valueLabels`; if absent uses a default green→orange→red palette |

```ts
// slider variant (e.g. smell intensity, 0-6)
{ id: "intensity", type: "scale", title: "How strong is it?", variant: "slider",
  min: 0, max: 6, minLabel: "0 · None", maxLabel: "6 · Extreme",
  valueLabels: ["None", "Very faint", "Faint", "Noticeable", "Strong", "Very strong", "Extreme"],
  valueColors: ["#7D7A75", "#46A171", "#46A171", "#D5803B", "#D5803B", "#E56458", "#E56458"] }

// pills variant (e.g. overall rating 1-5)
{ id: "rating", type: "scale", title: "Overall rating", min: 1, max: 5,
  minLabel: "Poor", maxLabel: "Excellent" }
```

#### `chips`

Row of selectable pills (wraps onto multiple lines). Answer value: `string` or
`string[]` (`multiple: true`). Component: `ChipsStepView`.

| Field | Type | Default | Notes |
|---|---|---|---|
| `multiple` | `boolean` | `true` | Single or multiple selection |
| `options` | `{ value, label }[]` | — (min 1) | Options |

```ts
{ id: "duration", type: "chips", title: "How long have you noticed it?", multiple: false,
  options: [
    { value: "lt5", label: "< 5 min" }, { value: "5-30", label: "5–30 min" },
    { value: "gt30", label: "> 30 min" }, { value: "persistent", label: "Persistent" },
  ] }
```

#### `faces`

Row of selectable emoji faces (hedonic scale), wraps onto a new row on narrow screens
instead of shrinking. Answer value: `string`. Component: `FacesStepView`.

| Field | Type | Default | Notes |
|---|---|---|---|
| `faces` | `{ value, emoji, label? }[]` | 5 standard faces (😞🙁😐🙂😄) | If `label` is absent, only the emoji is shown |

Behavior: on mount, the middle face in the array is auto-selected.

```ts
{ id: "hedonic", type: "faces", title: "How annoying is it?", required: false,
  faces: [
    { value: "1", emoji: "😊" }, { value: "2", emoji: "😐" }, { value: "3", emoji: "😕" },
    { value: "4", emoji: "🤢" }, { value: "5", emoji: "🤮" },
  ] }
```

#### `notes`

Free-form textarea. Answer value: `string`. Component: `NotesStepView`.

| Field | Type | Default | Notes |
|---|---|---|---|
| `placeholder` | `string` | `"Write here..."` | Textarea placeholder |

```ts
{ id: "notes", type: "notes", title: "Anything to add?", required: false,
  placeholder: "E.g. the smell gets stronger with a north wind…" }
```

#### `media`

Image and/or video capture/upload, multi-item by default. Answer value:
`UploadedItem[]` (`{ id, name, mimeType, size, dataUrl, kind: "image" | "video" }`, each
`dataUrl` read client-side via `FileReader`). Component: `MediaStepView`.

| Field | Type | Default | Notes |
|---|---|---|---|
| `placeholder` | `string` | `"Choose from library"` | Label of the library-picker button |
| `multiple` | `boolean` | `true` | Allow selecting/capturing more than one item at a time |
| `acceptImages` | `boolean` | `true` | Accept image files |
| `acceptVideos` | `boolean` | `false` | Accept video files |
| `imageFormats` | `string[]` | — (any image) | Restrict accepted image MIME types/extensions, e.g. `["image/jpeg", "image/png"]` |
| `videoFormats` | `string[]` | — (any video) | Restrict accepted video MIME types/extensions, e.g. `["video/mp4"]` |
| `maxItems` | `number` | — (no limit) | Maximum number of items the user can add |

Renders two controls: a **camera capture** button (`capture="environment"` on its own
file input — a separate input from the library picker, since relying on a single
input's implicit camera-or-gallery chooser is inconsistent across mobile browsers,
Safari in particular) and a **library** picker. Selected items show as a row of
thumbnails that always scrolls horizontally (mobile and desktop alike); each thumbnail
has a remove (✕) button and opens a full-size lightbox on click (images render inline,
videos get native playback controls), with its own remove action.

```ts
{ id: "photo", type: "media", title: "Add a photo", required: false }

// accept both photos and short videos, up to 4 items:
{ id: "evidence", type: "media", acceptImages: true, acceptVideos: true, maxItems: 4 }
```

To combine a text field with a media step on a single page (like the old
`notes-photo` used to), use [`group`](#group):

```ts
{ id: "notes-photo-group", type: "group", title: "Anything to add?", required: false,
  steps: [
    { id: "notes", type: "notes", required: false },
    { id: "photo", type: "media", required: false },
  ] }
```

#### `file`

Generic file upload (any type), multi-item by default. Answer value: `UploadedItem[]`
(`{ id, name, mimeType, size, dataUrl, kind: "file" }`). Component: `FileStepView`.

| Field | Type | Default | Notes |
|---|---|---|---|
| `placeholder` | `string` | `"Add file"` | Label of the picker button |
| `multiple` | `boolean` | `true` | Allow selecting more than one file at a time |
| `formatPreset` | `"any" \| "images" \| "documents" \| "pdf" \| "spreadsheets" \| "archives"` | `"any"` | Standard accepted-format preset |
| `customAccept` | `string` | — | Free-form `accept` string (extensions and/or MIME types, e.g. `".csv,.zip"`), combined with `formatPreset` |
| `maxItems` | `number` | — (no limit) | Maximum number of files the user can add |

Selected files show as a row of chips (icon by file category + name + size) that always
scrolls horizontally; each chip has a remove (✕) button and opens a preview (name, size,
type, and an "open/download" link) on click, with its own remove action.

```ts
{ id: "attachment", type: "file", title: "Attach a document", required: false,
  formatPreset: "documents", customAccept: ".pdf", multiple: true }
```

Use `media` for photos/videos and `file` for everything else (documents, spreadsheets,
archives, or an exact custom format) — both share the same `UploadedItem[]` shape and
interaction pattern (multi-select, remove, preview), so review/report/export code
handles them identically.

#### `date-time`

Native browser date/time input. Answer value: `string` in the matching `<input>`'s
format (`YYYY-MM-DD`, `HH:mm` or `YYYY-MM-DDTHH:mm`). Component: `DateTimeStepView`.

| Field | Type | Default | Notes |
|---|---|---|---|
| `mode` | `"date" \| "time" \| "datetime"` | `"date"` | Selects the native `<input>` type (`date`, `time`, `datetime-local`) |
| `min` / `max` | `string` | — | Bounds, same format as the value |
| `step` | `number` | — | The input's `step` attribute |
| `disablePast` | `boolean` | `false` | If `true` and `min` isn't specified, computes a `min` equal to the current moment |
| `defaultValue` | `string` | — | Initial value if not yet answered |

```ts
{ id: "date-time", type: "date-time", title: "When?", mode: "datetime", disablePast: true }
```

#### `nps`

Net Promoter Score, 0–10. Answer value: `number`. Component: `NpsStepView`.

| Field | Type | Default | Notes |
|---|---|---|---|
| `question` | `string` | — | Extended question text |

```ts
{ id: "nps", type: "nps", title: "Would you recommend us?",
  question: "How likely are you to recommend us to a friend or colleague?" }
```

#### `multi-select`

Generic multi-selection (checklist), with min/max constraints. Answer value:
`string[]`. Component: `MultiSelectStepView`.

| Field | Type | Default | Notes |
|---|---|---|---|
| `options` | `{ value, label }[]` | — (min 1) | Options |
| `min` | `number` | `0` | Minimum number of selections required |
| `max` | `number` | — | Maximum number of selections allowed |

```ts
{ id: "highlights", type: "multi-select", title: "What did you like most?", min: 0,
  options: [
    { value: "speed", label: "Speed" }, { value: "support", label: "Support" },
  ] }
```

#### `radio`

Single-selection list (radio buttons), one option per row. Answer value:
`string`. Component: `RadioStepView`. Same list layout as `multi-select`, but
renders a native `<input type="radio">` (single selection) instead of a
checkbox.

| Field | Type | Default | Notes |
|---|---|---|---|
| `options` | `{ value, label }[]` | — (min 1) | Options |

```ts
{ id: "contact-method", type: "radio", title: "How should we contact you?",
  options: [
    { value: "email", label: "Email" }, { value: "phone", label: "Phone" },
  ] }
```

#### `text`

Free text/number/email input. Answer value: `string`. Component: `TextStepView`.

| Field | Type | Default | Notes |
|---|---|---|---|
| `variant` | `"text" \| "number" \| "email"` | `"text"` | Changes validation: `"email"` requires a valid email format, `"number"` requires the value to be convertible with `Number(...)` |
| `placeholder` | `string` | — | Input placeholder |
| `multiline` | `boolean` | `false` | (reserved for future textarea use) |

```ts
{ id: "email", type: "text", title: "Want us to follow up?", required: false,
  variant: "email", placeholder: "name@example.com" }
```

#### `oauth`

OAuth redirect authentication step. See the dedicated [OAuth step](./oauth-step.md)
section.

#### `review`

Automatic summary of all answers given so far (excludes `intro`, `review` and
`confirmation`), including thumbnails for any image captured by a `media`/`file` step.
Its button becomes "Submit report ✓" (invokes `FlowRunner`'s `onSubmit`). Component:
`ReviewStepView`.

| Field | Type | Default | Notes |
|---|---|---|---|
| `meta` | `string` | — | Info banner above the summary |

```ts
{ id: "review", type: "review", title: "Ready to go?", subtitle: "Check and submit your report.",
  meta: "🌬️ We'll automatically add the weather and wind direction" }
```

#### `confirmation`

Final screen, no header/progress bar; footer with two buttons. Component:
`ConfirmationStepView`.

| Field | Type | Default | Notes |
|---|---|---|---|
| `title` | `string` | `"Thank you!"` | — |
| `message` | `string` | — | Subtitle |
| `emoji` | `string` | — | If present, replaces the default checkmark icon |
| `stats` | `{ value, label }[]` | — | Rows of statistics in side-by-side boxes |
| `primaryCta` / `secondaryCta` | `string` | `"Back to home"` / `"New report"` | Text of the two footer buttons |
| `emailShare` | object, see below | — | Enables the "send answers via email" (`mailto:`) button |
| `resultActions` | object, see [Result actions](./result-actions.md) | — | Additional optional result actions: `pdfExport`, `resultLink`, `nativeShare`, `emailApi` |

```ts
{ id: "confirmation", type: "confirmation", title: "Thank you!",
  message: "Your report has been recorded.",
  stats: [{ value: "35", label: "reports today nearby" }, { value: "#12", label: "yours today" }] }
```

#### `group`

Composes multiple steps into a single page, with no navigation of its own: it counts
as a normal flow step. The answer value is an aggregated object `{ [childId]: value }`
— children's answers stay nested under the group's id, not flattened into the
top-level `Answers`. The "Continue" button stays disabled until every `required`
(default `true`) child has a valid answer. Component: `GroupStepView`.

| Field | Type | Default | Notes |
|---|---|---|---|
| `layout` | `"stack" \| "columns"` | `"stack"` | `"stack"`: children stacked vertically. `"columns"`: children side by side, wrapping on narrow screens |
| `steps` | `Step[]` | — (min 1) | Child steps, same syntax as flow-level `steps[]` (any registered type, including `group` itself — untested/not recommended) |

```ts
{ id: "quick-group", type: "group", title: "A couple of quick questions", layout: "stack",
  steps: [
    { id: "satisfaction", type: "scale", title: "How satisfied are you?", min: 1, max: 5 },
    { id: "liked", type: "chips", title: "What did you like?", multiple: true,
      options: [{ value: "speed", label: "Speed" }, { value: "ease", label: "Ease of use" }] },
  ] }
```

Back to the [docs index](./README.md).
