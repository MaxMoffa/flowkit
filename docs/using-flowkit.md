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
| `@flowkit-io/react` | All 19 built-in steps | Default. Nothing else to import, everything works |
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
| `onStepChange` | `(step: CurrentStepInfo) => void` | no | Called every time the visibly rendered step changes — see below |

## Reading the current step

`onStepChange` fires with a `CurrentStepInfo` (`packages/core/src/machine.ts`):

```ts
interface CurrentStepInfo {
  id: string
  type: string
  title: string | null
  index: number // position within the resolved path, not the full flow schema
  total: number | null // length of the resolved path, null while it can't be determined yet
  previousStep: { id: string; type: string; title: string | null; index: number } | null
  direction: "initial" | "next" | "prev" | "jump" | "popstate" | "branch-change"
}
```

`FlowRunner` also exposes a `ref` handle (`FlowRunnerHandle`) with a `currentStep` property that always mirrors the most recent `onStepChange` call — including the very first one, already correct on the initial render, so you can read it without maintaining your own state:

```tsx
import { useRef } from "react"
import { FlowRunner, type FlowRunnerHandle } from "@flowkit-io/react"

function App() {
  const flowRef = useRef<FlowRunnerHandle>(null)
  return (
    <FlowRunner
      ref={flowRef}
      flow={feedbackFlow}
      onStepChange={(step) => analytics.track("flow_step", step)}
    />
  )
}
```

`index`/`total` are branch-aware (same source as the built-in progress bar, see `resolveFlowPath`/`getProgressInfo`): they count the steps actually reachable given the answers collected so far, never the raw count of steps declared in the flow's schema. `total` is `null` while an upcoming branch can't yet be resolved.

A "branch" (`role: "logic"`) step is fully transparent: it never triggers `onStepChange` and never appears as `currentStep` — the callback only fires once FlowRunner has resolved it and landed on the next visible step, and that step's `previousStep` points at the step before the branch, not at the branch itself.

`direction` explains how a step became current: `"initial"` on mount and after `flow.disableBack`-independent restarts (the confirmation step's "restart" action), `"next"`/`"prev"` for the primary/back buttons, `"jump"` for a review-row shortcut (or the "return to review" continue after editing one), and `"branch-change"` for a case with no equivalent in the other directions: the user goes Back past a branch, edits the answer that drives it, and the branch now resolves to a different target than the one they'd already walked. That edit doesn't move the visible step (still whichever field they're editing) but does discard any already-collected answers for the now-unreachable steps and recompute `total` — `onStepChange` fires again for the same `id` so an integration can react to the recount. `"popstate"` is reserved for a future browser-history integration; nothing emits it yet.

`FlowRunner` doesn't render the header/progress bar/Continue button on the `intro` and
`confirmation` steps ("hero" behavior, no chrome), while for every other step it
automatically shows: a back button, a progress bar, an `n/m` counter, and a footer with
the primary button (enabled only when the current step is valid per its rules). Set
`flow.disableBack: true` for forward-only navigation: the back button (header and
footer) is hidden, review-step shortcuts stop navigating to earlier steps, and the
browser's own back button no longer leaves the current step. Default `false` keeps
today's behavior unchanged. On
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
