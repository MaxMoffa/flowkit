# Using Flowkit in an app

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

## Entry points

| Import | Registers | When to use |
|---|---|---|
| `@flowkit-io/react` | All 18 built-in steps | Default. Nothing else to import, everything works |
| `@flowkit-io/react/lean` | Nothing | Bundle size matters: pair it with the steps you use |
| `@flowkit-io/react/steps/<type>` | That one step | Alongside `/lean`, one import per step type |
| `@flowkit-io/react/map-maplibre` | `location` | Always needed for the maplibre map step |
| `@flowkit-io/react/map-leaflet` | `location-leaflet` | Always needed for the leaflet map step |
| `@flowkit-io/react/payment-stripe` | `payment-stripe` | Always needed for the Stripe step |

`/lean` exports exactly the same API as the main entry; the only difference is that it
performs no registration. The three heavy steps at the bottom are never registered by
the main entry either, since they pull in maplibre-gl, leaflet or Stripe.js.

```tsx
import { FlowRunner } from "@flowkit-io/react/lean"
import "@flowkit-io/react/steps/intro"
import "@flowkit-io/react/steps/text"
import "@flowkit-io/react/steps/confirmation"
```

Measured on the built output: 11.9 KB gzip for the full entry, 6.0 KB for the lean one
plus those three steps. `FlowRunner` throws a descriptive error naming the missing type
if it meets a step nobody registered, so a forgotten import fails loudly.

`FlowRunner` props (`packages/react/src/FlowRunner.tsx`):

| Prop | Type | Required | Description |
|---|---|---|---|
| `flow` | `Flow` | yes | The flow config, typically the result of `parseFlow(...)` |
| `theme` | `Theme` | no (default `notionClean`) | Theme to apply, see [Configuring a theme](./theming.md) |
| `mode` | `"light" \| "dark"` | no (default `"light"`) | Theme variant to use |
| `onSubmit` | `(answers) => void \| Promise<void>` | no | Called when the user confirms the `review` step (before moving to `confirmation`) |
| `onChange` | `(answers) => void` | no | Called on every changed answer — useful for autosave/drafts |

`FlowRunner` doesn't render the header/progress bar/Continue button on the `intro` and
`confirmation` steps ("hero" behavior, no chrome), while for every other step it
automatically shows: a back button, a progress bar, an `n/m` counter, and a footer with
the primary button (enabled only when the current step is valid per its rules). On
desktop (≥1024px), back and continue split the footer row evenly (equal width), and the
progress bar can optionally move into the footer instead of the header — see
`layout.progressPosition` in [Configuring a theme](./theming.md). Every step is mounted
with `key={step.id}`: two consecutive steps of the same `type` (e.g. two `location`
steps) stay independent React instances, sharing no internal state or DOM side effects
(e.g. map instances).

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

Back to the [docs index](./README.md).
