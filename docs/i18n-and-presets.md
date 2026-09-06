# i18n

`@flowkit-io/core` ships a dictionary of the chrome/navigation/validation/status text
the library itself renders — footer buttons, the back button's aria-label, the
confirmation screen's restart/home defaults, validation/error messages, loading and
status text (verification widget, file-step placeholder, attachment-count suffix in
`answersToText`/the receipt-email reference template).

It does **not** cover your flow's own *content* — step titles/subtitles, option
labels, catalog/product item text. That's a separate, opt-in mechanism: see
[Localizable flow content (`ContentText`)](#localizable-flow-content-contenttext)
below. Fields it doesn't reach (a step's own `placeholder`, `validationMessages`, or
type-specific text like `checkbox.label`) stay plain strings — for those, define
parallel configs per locale as before.

Every flow can override any of these strings via `Flow.texts`:

```ts
const flow = parseFlow({
  id: "demo",
  title: "Demo",
  locale: "en",
  texts: {
    back: "Go back",
    continue: "Next step",
    verificationFailedRetry: "That didn't work — try again.",
  },
  steps: [ /* ... */ ],
})
```

Resolution order for a given key: `flow.texts[key]` → the dictionary entry for
`flow.locale` → the Italian default → the raw key. `resolveText(flow, key, fallback?)`
is the same function every built-in component uses internally — call it yourself if
you're building a custom step and want its chrome text to follow the same override
mechanism:

```ts
import { resolveText } from "@flowkit-io/core"

resolveText(flow, "back")                     // flow.texts.back, else the locale default
resolveText(flow, "myCustomKey", "Fallback")  // your own key, with your own fallback
```

See `defaultMessages` in `packages/core/src/i18n.ts` for the full key list and the
`it`/`en` defaults.

## Localizable flow content (`ContentText`)

A step's `title`/`subtitle`, an option's `label`/`description` (radio, chips,
multi-select, select-cards), and a catalog/product item's `label`/`description`/
`details` all accept a `ContentText` value: either a literal string (unchanged
default — every existing config keeps working with zero changes) or
`{ key: string, fallback?: string }`, resolved against `flow.content` — a free-form
dictionary you define, keyed however you like, in a namespace separate from
`flow.texts` (that one stays reserved for the library's own chrome/validation keys
above).

```ts
const flow = parseFlow({
  id: "demo",
  title: "Demo",
  locale: "en",
  content: {
    "welcome.title": "Welcome!",
    "shipping.express": "Express",
  },
  steps: [
    {
      id: "welcome",
      type: "intro",
      // Literal string — works exactly as before.
      title: "Benvenuto",
    },
    {
      id: "shipping",
      type: "radio",
      // { key, fallback? } — resolved from flow.content, falling back if unset.
      title: { key: "shipping.title", fallback: "Metodo di spedizione" },
      options: [
        { value: "std", label: { key: "shipping.standard", fallback: "Standard" } },
        { value: "exp", label: { key: "shipping.express", fallback: "Espressa" } },
      ],
    },
    // ...
  ],
})
```

Resolution order for a `ContentText` value: a literal string resolves to itself;
an object resolves `flow.content[value.key]` → `value.fallback` → the raw
`value.key` (so a missing dictionary entry renders as its key, not a blank string —
you notice the gap instead of shipping it silently). `resolveContentText(flow,
value)` is the function every built-in component uses internally — call it yourself
in a custom step that wants the same override mechanism:

```ts
import { resolveContentText } from "@flowkit-io/core"

resolveContentText(flow, step.title)   // ContentText -> resolved string
```

This is the mechanism that lets one saved flow serve several languages without
duplicating its structure: swap only the `content` dictionary (and `locale`) per
request, e.g. via `FlowRunner`'s `locale`/`content` props, which override
`flow.locale`/`flow.content` at render time without mutating the saved flow — the
same pattern `estimatedAddress` uses to inject platform data at runtime:

```tsx
<FlowRunner flow={savedFlow} locale="en" content={enContentDictionary} />
```

## Included presets

`@flowkit-io/presets` contains four ready-made flows, useful both as demos and as an
example of how to compose every step type:

- **`odoriFlow`** (`packages/presets/src/odori.ts`) — reporting a bad smell:
  `intro` → `location` (real map) → `select-cards` (type, 6 categories with icons) →
  `scale` slider (intensity 0–6, colored) → `chips` (duration) → `faces` (annoyance,
  optional) → `group` (`notes` + `media`, optional) → `review` (with a weather banner)
  → `confirmation` (with stats and an email button).
- **`feedbackFlow`** (`packages/presets/src/feedback.ts`) — feedback collection:
  `intro` → `faces` (mood) → `nps` → `multi-select` (positive aspects) → `text` email
  (optional) → `review` → `confirmation`.
- **`restaurantFlow`** (`packages/presets/src/restaurant.ts`) — table reservation:
  `intro` → `select-cards` (branch) → `text` number (party size) → `date-time` →
  `chips` (seating) → `select-cards` (occasion, optional) → `notes`
  (allergies/requests, optional) → `text` × 3 (name, email, phone) → `review` →
  `confirmation` (with `resultActions.pdfExport`/`nativeShare`).
- **`anagraficaFlow`** (`packages/presets/src/anagrafica.ts`) — personal-data
  collection: `intro` → `text` (nome, cognome, luogo di nascita, indirizzo) →
  `date-time` (data di nascita) → `text` with `pattern` (codice fiscale, telefono) →
  `text` email → `checkbox` (consenso privacy, required) → `review` → `confirmation`.
  Generic and meant to be customized (e.g. by the FlowLab builder): every field's
  label, order and validation lives in the flow config, nothing hardcoded in the step
  components.

```ts
import { odoriFlow, feedbackFlow, restaurantFlow, anagraficaFlow } from "@flowkit-io/presets"
```

The playground also includes additional demos (not standalone packages, just examples
in `apps/playground/src`): **"Custom step (demo)"** (`custom-step-demo.tsx`, see
[Custom steps](./custom-steps.md)), **"OAuth + Map (demo)"** (`features-demo.tsx`,
`oauth` step with custom icon/anonymous skip + `location` and `location-leaflet`
variants), **"Result actions (demo)"** (`result-actions-demo.tsx`, all four
confirmation `resultActions` wired to real adapters), **"Step file (demo)"**
(`file-step-demo.tsx`, the generic `file` step with a format preset + custom accept),
**"Conditional branching (demo)"** (`branch-demo.tsx`, see [`branch`](./steps/branch.md)),
**"Info steps (demo)"** (`info-long-content-demo.tsx`, see [`info`](./steps/info.md)
and [`long-content`](./steps/long-content.md)), **"Custom texts (demo)"**
(`i18n-texts-demo.tsx`, a `flow.texts` override), and **"Localizable content (demo)"**
(`content-text-demo.tsx`, a `flow.content` dictionary resolving some `ContentText`
title/option/item keys while others deliberately fall back, showing both code paths
in one flow).

Back to the [docs index](./README.md).
