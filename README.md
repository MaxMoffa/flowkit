```
   _____ _                _    _ _
  |  ___| |              | |  (_) |
  | |_  | | _____      __| | ___| |_
  |  _| | |/ _ \ \ /\ / /| |/ / | __|
  | |   | | (_) \ V  V / |   <| | |_
  \_|   |_|\___/ \_/\_/  |_|\_\_|\__|

   ( ● )──▶( ● )──▶( ● )──▶( ✓ )   guided flows, from config to done
```

# Flowkit

Open source library for composing **guided, mobile-first, themeable flows** from a
declarative config validated with [zod](https://zod.dev). Built for "one question per
screen" wizards such as reports, surveys, onboarding and multi-step forms: you write a
`Flow` object, Flowkit renders it, handles navigation and validation, and applies the
theme.

**Multi-framework status**: the core (`@flowkit-io/core`), themes (`@flowkit-io/themes`) and
adapters (`@flowkit-io/adapters`) are framework-agnostic by design. The **React** renderer
(`@flowkit-io/react`) is complete and covered by automated tests (unit + Playwright
end-to-end). **Vue, Svelte and vanilla JS renderers are planned but not yet
implemented** in this version — the CLI and this documentation cover React only for
now; sections for the other frameworks will return once the corresponding packages
exist.

npm monorepo (workspaces) made up of:

```
packages/core            # Flow/Step schema (zod), open step registry, state machine, oauth, geocoding, i18n
packages/react            # <FlowRunner>, <ThemeProvider>, components for every step type (incl. oauth, real map)
packages/themes            # notion-clean, mint-fresh, midnight-ink themes (tokens + CSS vars, light/dark, custom fonts/images)
packages/adapters           # answer persistence: local, rest, supabase (stub), notion
packages/presets              # ready-to-use flows: "odori", "feedback", "restaurant"
packages/create-flowkit         # CLI: `create-flowkit` (scaffold) and `flowkit-init` (installer)
apps/playground                   # Vite showcase app: preset/theme/dark-mode picker, mobile frame
e2e/                                 # Playwright end-to-end tests (React target only for now)
```

No dependency on an external state framework: the core is headless (no DOM), rendering
lives only in the chosen framework package (today: `@flowkit-io/react`).

---

## Table of contents

- [Installation](#installation)
- [CLI: `create-flowkit` and `flowkit-init`](#cli-create-flowkit-and-flowkit-init)
- [Quickstart: playground](#quickstart-playground)
- [Core concepts](#core-concepts)
- [Using Flowkit in an app](#using-flowkit-in-an-app)
- [Custom steps](#custom-steps)
- [Configuring a theme](#configuring-a-theme)
- [Defining a flow](#defining-a-flow)
  - [Fields common to every step](#fields-common-to-every-step)
  - [Reference by step type](#reference-by-step-type)
- [OAuth step](#oauth-step)
- [Map step (maplibre-gl / Leaflet)](#map-step-maplibre-gl--leaflet)
- [Sending answers via email](#sending-answers-via-email)
- [Persisting answers (adapters)](#persisting-answers-adapters)
- [i18n](#i18n)
- [Included presets](#included-presets)
- [Monorepo scripts](#monorepo-scripts)
- [End-to-end tests (Playwright)](#end-to-end-tests-playwright)
- [Extending Flowkit](#extending-flowkit)

---

## Installation

Requirements: Node 18+ and npm (used by the monorepo for workspaces).

```bash
npm install
```

If you consume Flowkit from another project (not from this monorepo), install the
packages you need from wherever you've published them:

```bash
npm install @flowkit-io/core @flowkit-io/react @flowkit-io/themes @flowkit-io/adapters
```

> The `@flowkit-io/*` packages are published on the public npm registry — see
> [npmjs.com/package/@flowkit-io/react](https://www.npmjs.com/package/@flowkit-io/react)
> (same for `core`, `themes`, `adapters`, `presets`, `create-flowkit`). Install directly
> with `npm install`/`npx` as shown above, no `file:` protocol or local monorepo needed.

`@flowkit-io/presets` is optional: it only contains ready-made examples, it isn't
required to use the library with your own config.

## CLI: `create-flowkit` and `flowkit-init`

The `packages/create-flowkit` package exposes two commands (**React** only in this
version; other frameworks are accepted by the prompt but fall back to React with a
warning, pending their renderer packages):

### `create-flowkit` — scaffold a mini-app

Creates a standalone Vite+React project, already wired with `@flowkit-io/presets` (the
`feedback` preset), the default theme and the `local` adapter — no backend required to
get started.

```bash
npx create-flowkit
# or, non-interactive (useful in CI/scripts):
npx create-flowkit --name my-app --framework react --yes
```

Prompts: project name, framework. Then: copies the template, renames `package.json`,
installs dependencies (unless `--no-install`), prints the commands to get started
(`cd my-app && npm run dev`).

### `flowkit-init` — add Flowkit to an existing project

```bash
npx flowkit-init
# or, non-interactive:
npx flowkit-init --framework react --yes
```

Detects the project's package manager (pnpm/yarn/npm from the lockfile present),
installs `@flowkit-io/core` + `@flowkit-io/themes` + `@flowkit-io/adapters` + the chosen
framework package, and writes a `src/flowkit-setup.tsx` file with the minimal wiring
(an empty `FlowRunner` ready to fill in) — not a whole preset.

`flowkit-init` also asks which **optional steps with heavy dependencies** (the two map
variants) you want to include: only the ones you choose get installed (`maplibre-gl`
and/or `leaflet`) and imported (`@flowkit-io/react/map-maplibre`/`map-leaflet`) in the
generated file — a project that doesn't use maps installs neither library.

```bash
npx flowkit-init --framework react --steps=map-maplibre,map-leaflet --yes
# --steps= (empty) or omitting a group excludes it
```

Both commands accept `--no-install` (skips installation, prints the command to run by
hand) and are scriptable end-to-end with `--framework`/`--name`/`--yes`/`--steps`,
because the interactive prompts (`@clack/prompts`) require a real terminal and don't
work when piping stdin.

## Quickstart: playground

```bash
npm run dev --workspace=@flowkit-io/playground
```

Open the URL printed by Vite. The page shows:

- a **Preset selector** (`odori`, `feedback`, `restaurant`, plus a few demos: custom
  steps, OAuth+Map, result actions);
- a **Theme selector** (`notion-clean`, `mint-fresh`, `midnight-ink`);
- a **light/dark toggle**;
- the rendered flow inside a **phone frame** with notch and status bar, whose colors
  follow the active theme;
- a **swatch strip** to compare themes at a glance;
- a debug panel with the JSON of submitted answers (`onSubmit`).

Use it as a visual reference before writing your own config: it's the fastest way to
understand how the various step types behave.

## Core concepts

| Concept | Lives in | What it is |
|---|---|---|
| `Flow` | `@flowkit-io/core` | zod-validated object: `{ id, title, locale, steps[] }` |
| `Step` | `@flowkit-io/core` | A "screen" of the flow; its `type` is resolved at runtime from a **registry** (see [Custom steps](#custom-steps)), not a closed union |
| `Answers` | `@flowkit-io/core` | `Record<stepId, value>`, the state filled in by the user |
| `Theme` | `@flowkit-io/themes` | `{ name, label, light, dark }`, each variant is a set of tokens (colors, spacing, fonts, images) |
| `FlowRunner` | `@flowkit-io/react` | React component that mounts a `Flow`, manages state/navigation/rendering |
| `FlowAdapter` | `@flowkit-io/adapters` | `{ submit, loadDraft, saveDraft }` interface for persisting answers (local/rest/supabase/notion) |

The typical flow: write a `Flow` with `parseFlow(...)`, pass it to `<FlowRunner>`
along with a `Theme` and an `onSubmit`, and once the user reaches the `review` step
and confirms, you receive `Answers` already validated according to each step's
`required` rules.

## Using Flowkit in an app

```tsx
import { FlowRunner } from "@flowkit-io/react"
import { notionClean } from "@flowkit-io/themes"
import { createLocalAdapter } from "@flowkit-io/adapters"
import { feedbackFlow } from "@flowkit-io/presets"
import "@flowkit-io/react/style.css" // base component styles (fk-*), required

const adapter = createLocalAdapter()

function App() {
  return (
    <FlowRunner
      flow={feedbackFlow}
      theme={notionClean}
      mode="light"
      onSubmit={(answers) => adapter.submit(feedbackFlow.id, answers)}
      onChange={(answers) => console.log("draft", answers)}
    />
  )
}
```

`FlowRunner` props (`packages/react/src/FlowRunner.tsx`):

| Prop | Type | Required | Description |
|---|---|---|---|
| `flow` | `Flow` | yes | The flow config, typically the result of `parseFlow(...)` |
| `theme` | `Theme` | no (default `notionClean`) | Theme to apply, see the themes section |
| `mode` | `"light" \| "dark"` | no (default `"light"`) | Theme variant to use |
| `onSubmit` | `(answers) => void \| Promise<void>` | no | Called when the user confirms the `review` step (before moving to `confirmation`) |
| `onChange` | `(answers) => void` | no | Called on every changed answer — useful for autosave/drafts |

`FlowRunner` doesn't render the header/progress bar/Continue button on the `intro` and
`confirmation` steps ("hero" behavior, no chrome), while for every other step it
automatically shows: a back button, a progress bar, an `n/m` counter, and a footer with
the primary button (enabled only when the current step is valid per its rules). Every
step is mounted with `key={step.id}`: two consecutive steps of the same `type` (e.g.
two `location` steps) stay independent React instances, sharing no internal state or
DOM side effects (e.g. map instances).

`<FlowRunner>` wraps everything in an internal `<ThemeProvider>`: if you need to apply
the theme to a wider layout (e.g. to also style your own elements around the flow),
you can use `<ThemeProvider>` directly:

```tsx
import { ThemeProvider } from "@flowkit-io/react"
import { midnightInk } from "@flowkit-io/themes"

<ThemeProvider theme={midnightInk} mode="dark">
  {/* any markup with fk-* classes will inherit the theme's CSS variables */}
</ThemeProvider>
```

## Custom steps

A step's `type` is no longer a closed union: `@flowkit-io/core` exposes a **runtime
registry** (`registerStepType`) and `@flowkit-io/react` the matching component registry
(`registerStepComponent`). The built-in steps register themselves on package import —
adding a new one doesn't require touching `schema.ts` or `registry.tsx`.

```ts
// 1. Schema + validation (framework-agnostic, in any file of your app)
import { z } from "zod"
import { registerStepType } from "@flowkit-io/core"

const ratingStarsStepSchema = z.object({
  id: z.string().min(1),
  type: z.literal("rating-stars"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  required: z.boolean().default(true),
  icon: z.string().optional(), // convention: include the base fields like the built-ins
  maxStars: z.number().default(5),
})
export type RatingStarsStep = z.infer<typeof ratingStarsStepSchema>

registerStepType({
  type: "rating-stars",
  schema: ratingStarsStepSchema,
  validate: (_step, value) => typeof value === "number" && value > 0,
})
```

```tsx
// 2. React component
import { registerStepComponent, type StepComponentProps } from "@flowkit-io/react"

function RatingStarsView({ step, value, onChange }: StepComponentProps<RatingStarsStep>) {
  const current = typeof value === "number" ? value : 0
  return (
    <div className="fk-step">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {Array.from({ length: step.maxStars }, (_, i) => i + 1).map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          {n <= current ? "⭐" : "☆"}
        </button>
      ))}
    </div>
  )
}

registerStepComponent("rating-stars", RatingStarsView)
```

```ts
// 3. The step appears in the flow config like any other type
{ id: "rating", type: "rating-stars", title: "How many stars?", maxStars: 5 }
```

**Optional type-safety**: `Step` is computed from a `StepTypeMap` interface that can be
augmented via TypeScript module augmentation. If you want `Step` to include your custom
type at the type level (full narrowing, no cast), augment the map:

```ts
declare module "@flowkit-io/core" {
  interface StepTypeMap {
    "rating-stars": RatingStarsStep
  }
}
```

Without this declaration the step still works at runtime (validated by the registry),
but needs to be cast to `Step` when you put it in a typed `steps[]` array. See a full
working example in `apps/playground/src/custom-step-demo.tsx` (the "Custom step (demo)"
preset in the playground).

### Custom intro/confirmation (`role`)

The `intro` and `confirmation` steps are "role steps": `FlowRunner` hides the
header/progress bar for them and drives the sticky footer (bottom CTA, or the two final
confirmation buttons) by generically reading the `cta`/`primaryCta`/`secondaryCta`
fields from the current step — it doesn't need to literally be `type: "intro"`/
`"confirmation"`.

If you want to replace *all* the content above the CTA (useful to turn it into a mini
landing page, or a final screen with custom social sharing/testimonials), register your
own step type with the same mechanism as a custom step, adding `role: "intro"` or
`role: "confirmation"` to the registration:

```ts
registerStepType({
  type: "intro-hero",
  schema: introHeroStepSchema, // includes a "cta" field like the standard intro
  validate: () => true,
  role: "intro", // FlowRunner hides the header and reads "cta" from this step
})
```

The React component registered for `"intro-hero"` can render any JSX: the sticky
footer with the CTA stays the standard `FlowRunner` one, generated automatically. The
same applies to `role: "confirmation"` (the standard footer reads `primaryCta`/
`secondaryCta` from the step). The built-in `intro`/`confirmation` steps remain
unchanged and fully backward-compatible — `role` is optional and only matters to those
who want to replace them.

Full example (`intro-hero` + `confirmation-hero`) in
`apps/playground/src/custom-intro-demo.tsx` (the "Custom intro & confirmation (demo)"
preset).

## Configuring a theme

A theme (`packages/themes/src/index.ts`) has this shape:

```ts
export interface Theme {
  name: string   // unique slug, e.g. "notion-clean"
  label: string  // human-readable label for a selector UI, e.g. "Notion Clean"
  light: ThemeTokens
  dark: ThemeTokens
}
```

`ThemeTokens` (`packages/themes/src/notion-clean.ts`) is the single place where
colors, base measurements and (optionally) fonts/images live:

```ts
export interface ThemeTokens {
  text: string        // primary text color
  text2: string       // secondary text color (subtitles, labels)
  canvas: string      // main background (white/black depending on mode)
  soft: string        // "soft" background for de-emphasized cards/inputs
  surface: string     // background for slightly more marked surfaces (progress track)
  border: string      // border color
  accent: string       // accent color (primary buttons, selections)
  accentSoft: string   // light tint of the accent (badges, selected cards)
  success: string      // semantic green
  successSoft: string
  warning: string      // semantic orange
  warningSoft: string
  danger: string       // semantic red
  dangerSoft: string
  radiusSm: string     // small border radius (e.g. back button, numeric pills)
  radiusMd: string     // medium border radius (cards, buttons, inputs)
  radiusLg: string     // large border radius (map, review box)
  radiusXl: string     // extra border radius (landing badge)
  spacing: Record<"xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl", string>
  fonts?: {              // optional: typography customization
    heading?: string
    body?: string
    headingSize?: string
    bodySize?: string
    headingFontUrl?: string  // URL of a font-face/stylesheet to inject
    bodyFontUrl?: string
  }
  images?: {             // optional: image customization
    background?: string          // global flow background
    stepBackground?: Record<string, string> // background for a specific step id/type
    logo?: string
  }
}
```

These tokens are translated into CSS variables (`--fk-*`) by `themeToCssVars` and
injected inline on the `<ThemeProvider>` container — no CSS-in-JS, no classes
generated at runtime: all the rest of the CSS (`packages/react/src/style.css`) only
reads `var(--fk-*)`. `fonts`/`images` are additive: if absent, the CSS behavior is
identical to before they were introduced.

### Custom fonts and images

```ts
const myTheme: Theme = {
  name: "brand",
  label: "Brand",
  light: {
    ...notionClean.light,
    fonts: {
      heading: "'Fraunces', serif",
      body: "'Inter', sans-serif",
      headingFontUrl: "https://fonts.example/fraunces.css",
      bodyFontUrl: "https://fonts.example/inter.css",
    },
    images: { background: "/brand-bg.jpg", logo: "/brand-logo.svg" },
  },
  dark: notionClean.dark,
}
```

`@flowkit-io/themes` exposes `injectThemeFontLinks(theme, mode)` (returns the font URLs to
load): the themes package stays framework-agnostic, so actually injecting the
`<link rel="stylesheet">` into the DOM is the host app's responsibility (or a renderer
like `@flowkit-io/react`, in a future version with built-in support).

### Page/step background, header/footer position, progress bar, animations

```ts
const myTheme: Theme = {
  name: "brand",
  label: "Brand",
  light: {
    ...notionClean.light,
    images: {
      background: "/brand-bg.jpg",        // global background for all pages
      stepBackground: { intro: "/brand-hero.jpg" }, // override for a specific step id or type
    },
    layout: {
      headerPosition: "top",    // "top" (default) | "bottom"
      footerPosition: "bottom", // "top" | "bottom" (default)
      progressVariant: "dots",  // "bar" (default) | "dots" | "hidden" | custom key
    },
    animation: {
      name: "slide", // "none" (default) | "fade" | "slide" | custom name
      duration: 250,  // ms
    },
  },
  dark: notionClean.dark,
}
```

All optional: a theme that doesn't set them behaves exactly like today. The background
(image or SVG, even as a data-URI) applies behind the cards, which stay opaque.
`progressVariant: "hidden"` only hides the bar, not the back button. A custom variant
registers like step components:

```ts
import { registerProgressComponent } from "@flowkit-io/react"

registerProgressComponent("my-style", ({ pct, currentIndex, total }) => (
  <div>{currentIndex + 1} of {total} ({pct}%)</div>
))
// then: theme.layout.progressVariant = "my-style"
```

The `"fade"`/`"slide"` animations are ready to use; a different name only applies the
`fk-anim-${name}-enter`/`fk-anim-${name}-dir-next|prev` classes to the step wrapper,
CSS/keyframes to be provided by the host app — same "bring your own CSS" approach as
custom themes.

The **"showcase"** theme (`themes.showcase` / selectable in the playground) shows all
of these features together, for demonstration purposes.

Even a single step can override part of the theme while it's shown, via the common
`themeOverride` field (see [Fields common to every step](#fields-common-to-every-step)):

```ts
{ id: "final-quiz", type: "scale", themeOverride: { accent: "#E56458" }, /* ... */ }
```

### Creating a custom theme

No need to modify `@flowkit-io/themes`: just build a compatible `Theme` object and pass
it to `FlowRunner`.

```ts
import type { Theme } from "@flowkit-io/themes"

export const brandTheme: Theme = {
  name: "brand",
  label: "Brand",
  light: {
    text: "#1A1A1A",
    text2: "#6B6B6B",
    canvas: "#FFFFFF",
    soft: "#F7F7F5",
    surface: "#EFEFEC",
    border: "#E2E2DE",
    accent: "#FF5A36",
    accentSoft: "#FFEAE3",
    success: "#2FA35E",
    successSoft: "#E3F5E8",
    warning: "#D89B3C",
    warningSoft: "#FBF0DC",
    danger: "#E0615A",
    dangerSoft: "#FBE6E4",
    radiusSm: "10px",
    radiusMd: "14px",
    radiusLg: "20px",
    radiusXl: "28px",
    spacing: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", xxl: "32px", xxxl: "48px" },
  },
  dark: {
    /* same shape, dark-mode values */
    text: "#F2F2F0", text2: "#A0A0A0", canvas: "#141414", soft: "#1C1C1C",
    surface: "#242424", border: "#333333", accent: "#FF7A5C", accentSoft: "#3A2018",
    success: "#4CCB86", successSoft: "#16301F", warning: "#E4AC5C", warningSoft: "#332815",
    danger: "#EC7B74", dangerSoft: "#332120",
    radiusSm: "10px", radiusMd: "14px", radiusLg: "20px", radiusXl: "28px",
    spacing: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", xxl: "32px", xxxl: "48px" },
  },
}
```

```tsx
<FlowRunner flow={myFlow} theme={brandTheme} mode="light" />
```

If you just want **targeted overrides** without creating a whole theme, you can also
set CSS variables by hand on a container around `FlowRunner`:

```css
.my-wrapper {
  --fk-accent: #ff5a36;
  --fk-radius-md: 10px;
}
```

```tsx
<div className="my-wrapper">
  <FlowRunner flow={myFlow} theme={notionClean} />
</div>
```

### Helpers available in `@flowkit-io/themes`

```ts
themeToCssVars(theme, mode)      // -> Record<"--fk-...", string>, useful for inline style
themeToCssString(theme, mode)    // -> "key: value;\n..." string for a static <style>
injectThemeFontLinks(theme, mode) // -> string[] of font URLs to inject (see above)
```

### Included themes

| `name` | `label` | Palette |
|---|---|---|
| `notion-clean` | Notion Clean | Warm neutral, blue accent `#2783DE` (default) |
| `mint-fresh` | Mint Fresh | Green neutral, emerald green accent `#16A87E` |
| `midnight-ink` | Midnight Ink | Purple-ish neutral, indigo accent `#6753E0` |

```ts
import { themes, notionClean, mintFresh, midnightInk } from "@flowkit-io/themes"

Object.entries(themes) // [["notion-clean", notionClean], ["mint-fresh", mintFresh], ["midnight-ink", midnightInk]]
```

## Defining a flow

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

### Fields common to every step

Every object in `steps[]` — whatever its `type` — accepts these base fields:

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | — (required) | Unique step identifier within the flow; key in `Answers` |
| `type` | `string` | — (required) | Determines the extra schema and component used, resolved at runtime by the registry |
| `title` | `string` | — | Title (`<h1>`/`<h2>` depending on the step) |
| `subtitle` | `string` | — | Subtitle/description under the title |
| `required` | `boolean` | `true` | If `false`, the step is always considered valid: the "Continue" button doesn't block waiting for an answer |
| `icon` | `string` (emoji) | — | Icon shown in the `review` step's summary row (if absent, a default icon is used based on `type`) |
| `themeOverride` | object (subset of theme tokens) | — | Overrides some theme tokens (colors, radii, images) only while this step is shown, e.g. `{ accent: "#E56458" }`. See [Configuring a theme](#configuring-a-theme) |

The order of `steps[]` is the navigation order. There's no concept of a
conditional/branching step: if you need that, compose different flows and choose which
one to mount at runtime (as the playground does with its Preset selector).

### Reference by step type

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
[Map step](#map-step-maplibre-gl--leaflet) section for the full config (`selectionMode`,
map style, geocoding).

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
| `selectionMode` | see [Map step](#map-step-maplibre-gl--leaflet) | `{ kind: "point" }` | What "selecting" means on the map (ignored if `showMap: false`) |
| `initialCenter` | `{ lat, lng, zoom? }` | Rome, zoom 11 | Initial map center/zoom |
| `extraMarkers` | `{ lat, lng, label? }[]` | — | Additional decorative, non-selectable markers |
| `fullContainer` | `boolean` | `false` | Map fills the entire step viewport, edge-to-edge; title/subtitle/search collapse into a floating scrim bar on top, and the GPS button/result/errors collapse into a floating card at the bottom. Also available on `location-leaflet`. |

`showMap`, `showSearch` and `enableGps` are independent: combine them however you like
(search-only, map-only, GPS-only, or any combination) to adapt the step to different
cases without having to choose among several step types.

On desktop (≥1024px), a `location`/`location-leaflet` step not using `fullContainer`
automatically switches to a 2-column layout: search/GPS/result controls on the left,
map on the right — no config needed, it's chrome-level responsiveness.

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

Row of selectable emoji faces (hedonic scale). Answer value: `string`. Component:
`FacesStepView`.

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

#### `photo`

Photo upload. Answer value: `string | null` (a data-URL read via `FileReader`, fully
client-side). Component: `PhotoStepView`.

| Field | Type | Default | Notes |
|---|---|---|---|
| `placeholder` | `string` | `"Add a photo"` | Text shown in the empty box |

```ts
{ id: "photo", type: "photo", title: "Add a photo", required: false }
```

To combine the two steps into a single page (like the old `notes-photo` used to), use
[`group`](#group):

```ts
{ id: "notes-photo-group", type: "group", title: "Anything to add?", required: false,
  steps: [
    { id: "notes", type: "notes", required: false },
    { id: "photo", type: "photo", required: false },
  ] }
```

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

OAuth redirect authentication step. See the dedicated [OAuth step](#oauth-step)
section.

#### `review`

Automatic summary of all answers given so far (excludes `intro`, `review` and
`confirmation`). Its button becomes "Submit report ✓" (invokes `FlowRunner`'s
`onSubmit`). Component: `ReviewStepView`.

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
| `resultActions` | object, see [Sending answers via email](#sending-answers-via-email) | — | Additional optional result actions: `pdfExport`, `resultLink`, `nativeShare`, `emailApi` |

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

## OAuth step

Step of type `oauth`: shows a button for each enabled provider, which on click does a
**full redirect** to the provider's authorize URL (PKCE included where required). The
library **never performs the code→token exchange**: it only builds the redirect URL;
completing the OAuth flow (parsing the redirect URI, calling the token endpoint) is the
host app's responsibility.

```ts
{
  id: "login",
  type: "oauth",
  title: "Sign in to continue",
  required: false,
  providers: [
    {
      id: "google",              // "google" | "github" | "facebook" | custom id
      clientId: "YOUR_CLIENT_ID",
      redirectUri: "https://your-domain.com/oauth/callback",
      scopes: ["profile", "email"],
      usePkce: true,              // default true, generates code_verifier/code_challenge via Web Crypto
      icon: "🔵",                  // optional: overrides the provider's default emoji
    },
    {
      id: "generic",               // unknown provider: authorizeUrl required
      clientId: "...",
      authorizeUrl: "https://custom-provider.example.com/oauth/authorize",
      redirectUri: "https://your-domain.com/oauth/callback",
    },
  ],
  allowAnonymous: true,           // shows a button to proceed without authenticating
  anonymousLabel: "Continue without an account",
}
```

Known providers with a preset authorize URL: `google`, `github`, `facebook` (public
URLs only, no secrets). For a provider not listed, use `id: "generic"` (or an id of
your choice) with an explicit `authorizeUrl`. Every provider can have a custom `icon`
(emoji): if absent, the known default is used, then the generic lock emoji 🔐.

If `allowAnonymous: true`, an extra button lets the user proceed without
authenticating: the step's value becomes `{ providerId: "", anonymous: true }`, a state
distinct both from "not answered" (`null`) and from a real connection.

**Completing the login** after the redirect, on the host app side:

```ts
import { completeOAuthCallback } from "@flowkit-io/core"

// on the return page (redirectUri), reading the query string or hash:
const result = completeOAuthCallback("google", window.location.search)
// result: { providerId, code?, token?, state? }

// then, your choice:
// 1) exchange `code` for a token on your backend (never in the browser: would require the client secret)
// 2) pass `result` as the oauth step's value (e.g. via FlowRunner's onChange,
//    resuming the flow state where you left it before the redirect)
```

`generatePkcePair()`/`buildAuthorizeUrl(provider, pkce?)` are exported from
`@flowkit-io/core` if you need to build the URL manually outside the step.

## Map step (maplibre-gl / Leaflet)

Step of type `location`: real map rendered with [maplibre-gl](https://maplibre.org/),
place search (geocoding, default [Nominatim/OSM](https://nominatim.org)), configurable
selection.

```ts
{
  id: "pick-spot",
  type: "location",
  title: "Pick a spot on the map",
  styleUrl: "https://demotiles.maplibre.org/style.json",  // replaceable with your own style
  geocodingEndpoint: "https://nominatim.openstreetmap.org/search", // replaceable (self-hosted server, other provider)
  selectionMode: { kind: "point" },  // default
  initialCenter: { lat: 41.9, lng: 12.5, zoom: 11 },
}
```

### `selectionMode`: what "selecting" means

```ts
type SelectionMode =
  | { kind: "point" }                                              // default: free draggable pin
  | { kind: "region"; regions: GeoJSONFeature[] }                    // click inside a polygon → regionId
  | { kind: "preset-points"; points: { id, label, lat, lng }[] }     // click on a fixed point → pointId
```

- **`point`** (default): click/drag on the map places a draggable marker, `value`
  becomes `{ lat, lng }`.
- **`preset-points`**: shows a marker for each point in the list; clicking a marker
  sets `value: { lat, lng, pointId }`.
- **`region`**: clicking inside one of the provided GeoJSON polygons sets
  `value: { regionId }` (point-in-polygon computed client-side, no external dependency
  like turf).

### Customizing the rendering

- **Declarative** (stays in the config, serializable): `extraMarkers` adds decorative,
  non-selectable markers.
- **Full override** (custom markers with logic, function hooks): doesn't go through
  the JSON config (which must stay serializable), but through the "wrap the default
  registered component" pattern — register your own component for `"location"` that
  internally uses `LocationStepView` and passes it direct props:

```tsx
import { registerStepComponent, LocationStepView } from "@flowkit-io/react"

function CustomLocationView(props) {
  // add non-serializable logic/hooks here, then delegate to the default:
  return <LocationStepView {...props} />
}

registerStepComponent("location", CustomLocationView)
```

### Leaflet variant (`location-leaflet`)

The exact same config as `location` (`selectionMode`, geocoding, GPS, search...), but
with [Leaflet](https://leafletjs.com/) as the rendering engine instead of maplibre-gl
(default OpenStreetMap tiles). Use this variant if you prefer Leaflet or want to avoid
the maplibre-gl dependency.

```ts
{ id: "pick-spot-leaflet", type: "location-leaflet", title: "Pick a spot on the map" }
```

**Both map variants are opt-in**: `@flowkit-io/react` registers neither `location` nor
`location-leaflet` by default. Import only the entry point you need:

```ts
import "@flowkit-io/react/map-maplibre"  // registers "location" (+ maplibre-gl peer dependency)
import "@flowkit-io/react/map-leaflet"   // registers "location-leaflet" (+ leaflet peer dependency)
```

This avoids downloading both map libraries in projects that don't use a map step. The
`flowkit-init --steps=map-maplibre,map-leaflet` CLI writes these imports (and the
matching npm dependencies) only for the steps you choose — see
[CLI](#cli-create-flowkit-and-flowkit-init).

## Sending answers via email

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
mail client.

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

### Other result actions (`resultActions`)

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
  dedicated summary (`.fk-print-recap`), styled with a `@media print` sheet — the user
  chooses "Save as PDF" from the browser's print dialog.
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
matching the notion-clean look — a reference function for the consumer's backend, not
called from any client-side code in this repo.

## Persisting answers (adapters)

`@flowkit-io/adapters` exposes the same interface (`FlowAdapter`) for four different
backends:

```ts
export interface FlowAdapter {
  submit(flowId: string, answers: Answers): Promise<void>
  loadDraft(flowId: string): Promise<Answers | null>
  saveDraft(flowId: string, answers: Answers): Promise<void>
  /** Optional: persists the answers with a unique id and returns a shareable link.
   *  Implemented by createLocalAdapter and createRestAdapter; used by
   *  confirmation's resultActions.resultLink. */
  createResultLink?(flowId: string, answers: Answers): Promise<{ id: string; url: string }>
}
```

### `createLocalAdapter` — localStorage

```ts
import { createLocalAdapter } from "@flowkit-io/adapters"

const adapter = createLocalAdapter({
  namespace: "flowkit-playground", // storage key prefix, default "flowkit"
  storage: window.localStorage,     // optional, to inject a compatible Storage (e.g. in tests)
})
```

### `createRestAdapter` — HTTP endpoint

```ts
import { createRestAdapter } from "@flowkit-io/adapters"

const adapter = createRestAdapter({
  baseUrl: "https://api.your-domain.com",
  headers: { Authorization: "Bearer ..." }, // optional
  fetchImpl: myFetch,                        // optional, default global fetch
})
```

`submit` does `POST ${baseUrl}/flows/${flowId}/submissions`. Drafts stay in memory only
(not persisted server-side). `createResultLink` does
`POST ${baseUrl}/flows/${flowId}/results`, expecting a JSON `{ id, url }` response from
your backend.

### `createSupabaseAdapter` — Supabase stub

```ts
import { createSupabaseAdapter } from "@flowkit-io/adapters"
import { createClient } from "@supabase/supabase-js"

const client = createClient(url, key)
const adapter = createSupabaseAdapter({ client, table: "flow_submissions" /* default */ })
```

The package **does not depend on** `@supabase/supabase-js`: you pass in an already
initialized client that satisfies the minimal `SupabaseClientLike` interface.

### `createNotionAdapter` — pages in a Notion database

```ts
import { createNotionAdapter } from "@flowkit-io/adapters"

const adapter = createNotionAdapter({
  token: process.env.NOTION_TOKEN!,   // integration token, never hardcoded
  databaseId: "your-database-id",
  mapAnswersToProperties: (answers, flowId) => ({ /* custom mapping, optional */ }),
})
```

`submit` creates (or updates, if a draft exists) a page in the configured Notion
database, via direct REST calls (no dependency on `@notionhq/client`). Default
mapping: string → `rich_text`, number → `number`, array → `multi_select`, anything
else → JSON in `rich_text`. Notion has no native concept of a draft: `loadDraft`/
`saveDraft` operate on a page with a boolean `draft` property, filtered by a `flowId`
(rich_text) property — no local storage, every read/write goes through the Notion API.
The target Notion database must have (at least) the `flowId` (text) and `draft`
(checkbox) properties, plus a property for each answer you want to map (or a custom
`mapAnswersToProperties`).

### Writing a custom adapter

```ts
import type { FlowAdapter } from "@flowkit-io/adapters"

export function createMyAdapter(): FlowAdapter {
  return {
    async submit(flowId, answers) { /* ... */ },
    async loadDraft(flowId) { return null },
    async saveDraft(flowId, answers) { /* ... */ },
  }
}
```

## i18n

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
  optional) → `group` (`notes` + `photo`, optional) → `review` (with a weather banner)
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
[Custom steps](#custom-steps)), **"OAuth + Map (demo)"** (`features-demo.tsx`, `oauth`
step with custom icon/anonymous skip + `location` and `location-leaflet` variants) and
**"Result actions (demo)"** (`result-actions-demo.tsx`, all four confirmation
`resultActions` wired to real adapters).

## Monorepo scripts

```bash
npm run lint        # eslint across the whole monorepo
npm run typecheck   # tsc --noEmit (uses package sources via `paths`, not the dist output)
npm run test        # vitest (unit tests: core, themes, adapters, react registry, CLI)
npm run build       # builds every package (tsup) + the playground (vite build)
npm run verify      # lint + typecheck + test + build + scripts/spec-check.mjs
npm run test:e2e    # Playwright, not included in `verify` (slower, requires a browser)
```

`npm run verify` is the project's "definition of done" gate (see `CLAUDE.md`): it must
pass before considering a task complete. `npm run test:e2e` runs separately (also in
CI, in a dedicated workflow) because it involves building+previewing the playground
and launching a browser: slower, not meant for `verify`'s fast cycle.

**Note for anyone developing inside this monorepo**: `apps/playground` imports the
`@flowkit-io/*` packages from their respective `dist/` output (not from sources via HMR).
If you change `packages/react`, `packages/core`, `packages/themes` etc. and want to see
the effect in the playground in dev, you need to rebuild the touched package before
reloading the page:

```bash
npm run build --workspace=@flowkit-io/react --workspace=@flowkit-io/core
```

(`packages/react/src/style.css` is an exception: it's imported by direct path, so CSS
changes are live without a rebuild.)

## End-to-end tests (Playwright)

`e2e/` (at the repo root, not inside a package) contains the Playwright suite, React
target for now:

- `flow-parity.spec.ts` — walks the `odori`/`feedback` presets end-to-end up to
  `confirmation`.
- `theme-visual.spec.ts` — baseline screenshots of the intro screen for the 3 themes
  (`--update-snapshots` to regenerate them after an intentional style change), plus
  the `showcase` theme's background/dots-progress/footer-on-top/animation/per-step
  `themeOverride` features.
- `oauth-step.spec.ts` — intercepts the OAuth redirect and checks the authorize URL's
  parameters (`client_id`, `redirect_uri`, PKCE).
- `oauth-anonymous.spec.ts` — custom provider icon and the `allowAnonymous` skip
  button/state.
- `map-step.spec.ts` — real map (maplibre-gl): `point` selection via click,
  `preset-points` via marker, real geocoding search (Nominatim), `showMap`/
  `showSearch`/`enableGps` combinations, GPS button position/style, reverse geocoding
  (mocked, success and error fallback).
- `map-leaflet-step.spec.ts` — `location-leaflet` step: map renders and a click sets a
  value.
- `date-time-step.spec.ts` — `date-time` step: `datetime-local` input, `disablePast`
  min, validation gating.
- `group-step.spec.ts` — `group` step: inline rendering of children, aggregated
  validation ("Continue" blocked until every required child has an answer).
- `notes-photo-split.spec.ts` — `notes`/`photo` group: both optional, independently
  skippable.
- `restaurant-preset.spec.ts` — walks the `restaurant` preset end-to-end up to
  `confirmation`.
- `confirmation-result-actions.spec.ts` — the four `resultActions`: `pdfExport` recap
  content, `nativeShare` feature-detection, `resultLink` generation/copy, `emailApi`
  success/error states.
- `cli-scaffold.spec.ts` — launches `flowkit-init`/`create-flowkit` in a temporary
  folder, non-interactively (`--framework react --no-install`, plus `--steps=...`
  variants), and inspects the generated files.

```bash
npm run build --workspace=@flowkit-io/create-flowkit   # required before cli-scaffold.spec.ts
npx playwright install chromium                     # one-time
npm run test:e2e
```

Also runs in CI (`.github/workflows/e2e.yml`), separate from the `verify` gate
(`.github/workflows/ci.yml`).

## Extending Flowkit

- **New step type**: see [Custom steps](#custom-steps) — `registerStepType` (core) +
  `registerStepComponent` (react), no changes to package files required.
- **New theme**: create a file in `packages/themes/src/` with `light`/`dark`
  `ThemeTokens` (see [Configuring a theme](#configuring-a-theme)) and add it to the
  `themes` map in `packages/themes/src/index.ts` — or, if you don't need to contribute
  it to the package, build the `Theme` object directly in your app and pass it to
  `FlowRunner` without touching this repo.
- **New adapter**: implement `FlowAdapter` (see above), no changes to the core or
  renderer required.
- **New framework renderer** (Vue/Svelte/vanilla, planned): reuse `@flowkit-io/core`/
  `@flowkit-io/themes`/`@flowkit-io/adapters` unchanged; replicate the `StepComponentProps`
  contract (`step`/`value`/`onChange` or equivalent/`flow`/`answers`) and the registry
  pattern (`registerStepComponent`/`getStepComponent`) seen in
  `packages/react/src/registry.tsx`.
