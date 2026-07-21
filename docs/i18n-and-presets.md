# i18n

`@flowkit-io/core` exposes a small dictionary for generic navigation strings:

```ts
import { t } from "@flowkit-io/core"

t("it", "next")     // "Avanti"
t("en", "back")     // "Back"
```

Covers only `next`, `back`, `submit`, `required` (locale `it`/`en`, falling back to
`it`). Domain-specific text (titles, subtitles, option labels...) stays part of your
`Flow`: if you need a multilingual flow, define parallel configs per locale.

## Included presets

`@flowkit-io/presets` contains three ready-made flows, useful both as demos and as an
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

```ts
import { odoriFlow, feedbackFlow, restaurantFlow } from "@flowkit-io/presets"
```

The playground also includes additional demos (not standalone packages, just examples
in `apps/playground/src`): **"Custom step (demo)"** (`custom-step-demo.tsx`, see
[Custom steps](./custom-steps.md)), **"OAuth + Map (demo)"** (`features-demo.tsx`,
`oauth` step with custom icon/anonymous skip + `location` and `location-leaflet`
variants), **"Result actions (demo)"** (`result-actions-demo.tsx`, all four
confirmation `resultActions` wired to real adapters) and **"Step file (demo)"**
(`file-step-demo.tsx`, the generic `file` step with a format preset + custom accept).

Back to the [docs index](./README.md).
