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
| `@flowkit-io/react/overlay` | Nothing | `<FlowOverlay>` — present a flow as a bottom drawer, a centered dialog or a fullscreen takeover; use alongside the main or `/lean` entry |

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
| `onChange` | `(answers) => void` | no | Called on every changed answer — useful for autosave/drafts. Receives the answers as they stand *after* the change, including the removal of any answer the change made unreachable (see `"branch-change"` below), so a persisted draft never resurrects a step the flow no longer goes through |
| `onStepChange` | `(step: CurrentStepInfo) => void` | no | Called every time the visibly rendered step changes — see below |
| `initialStep` | `string` | no | Id of the step to start on instead of the first step — see [Resuming a flow](#resuming-a-flow) |
| `initialAnswers` | `Answers` | no | Answers to preload before the flow ever renders — see [Resuming a flow](#resuming-a-flow) |
| `haptics` | `boolean` | no (default `true`) | Short device vibration on the navigation buttons (continue/back/submit, review-row jumps, restart), plus a distinct longer buzz on a blocked-while-invalid attempt. Needs the Vibration API (Android); a silent no-op on iOS/desktop. `false` opts out |

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

`FlowRunner` also exposes a `ref` handle (`FlowRunnerHandle`) with a `currentStep` property that always mirrors the most recent `onStepChange` call — including the very first one, already correct on the initial render, so you can read it without maintaining your own state. The handle also lets you drive the flow from outside: `goToStep(stepId)` jumps to a step if it's reachable given the current answers (returns `false` and does nothing otherwise, never throws), `getAnswers()`/`setAnswers(answers)` read and replace the collected answers, and `reset()` returns the flow to its blank starting state (same as the confirmation screen's restart action — ignores `initialStep`/`initialAnswers`, see below).

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

`direction` explains how a step became current: `"initial"` on mount and after `flow.disableBack`-independent restarts (the confirmation step's "restart" action), `"next"`/`"prev"` for the primary/back buttons, `"jump"` for a review-row shortcut (or the "return to review" continue after editing one, or an imperative `goToStep`), and `"branch-change"` for a case with no equivalent in the other directions: the user edits an answer that drives a branch — having gone Back past it, or having reached it from a review row — and that branch now resolves to a different target than the one they'd already walked. The edit doesn't move the visible step (still whichever field they're editing) but does discard any already-collected answers for the now-unreachable steps and recompute `total` — `onStepChange` fires again for the same `id` so an integration can react. It fires even when `index`/`total` come out identical (two routes of the same length): the steps ahead changed, which is the point of the event. Note that continuing from such an edit walks the newly opened route rather than jumping back to the review, since its steps have never been answered. `"popstate"` is reserved for a future browser-history integration; nothing emits it yet.

## Resuming a flow

`initialStep`/`initialAnswers` let you re-mount `FlowRunner` mid-flow — typically to survive a page refresh. Both are read once, at mount: changing them on a later render has no effect (same as a `defaultValue`-style prop). Persist whatever you need from `onChange`/`onStepChange` (e.g. to `localStorage`), then pass it back in on the next mount:

```tsx
import { useEffect, useRef, useState } from "react"
import { FlowRunner, type FlowRunnerHandle } from "@flowkit-io/react"
import type { Answers } from "@flowkit-io/core"

function App() {
  const [saved] = useState(() => {
    const raw = localStorage.getItem("flow-progress")
    return raw ? (JSON.parse(raw) as { stepId: string; answers: Answers }) : null
  })
  const flowRef = useRef<FlowRunnerHandle>(null)

  return (
    <FlowRunner
      ref={flowRef}
      flow={feedbackFlow}
      initialStep={saved?.stepId}
      initialAnswers={saved?.answers}
      onStepChange={(step) => {
        localStorage.setItem(
          "flow-progress",
          JSON.stringify({ stepId: step.id, answers: flowRef.current!.getAnswers() }),
        )
      }}
    />
  )
}
```

Neither prop ever throws: an unknown `initialStep` id, or one that isn't reachable given `initialAnswers` (e.g. a branch would route elsewhere), falls back silently to the normal initial step. `initialAnswers` entries are validated the same way a live answer is (each step type's own validation rule) — an invalid value, or a key that doesn't match any step's `key`/`id`, is dropped rather than rejected outright. Both are fully optional and backward compatible: omit them and `FlowRunner` behaves exactly as before.

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

## Presenting a flow in a drawer or dialog

`<FlowOverlay>` from `@flowkit-io/react/overlay` renders a flow in a portal as a bottom
**drawer** (mobile-web sheet, swipe-down to dismiss), a centered **dialog**, or a
**fullscreen** takeover — for embedding a flow in an existing app without a dedicated
page. It **composes
`<FlowRunner>`**: every `FlowRunner` prop and the `ref` handle (`FlowRunnerHandle`) work
exactly the same. It registers no steps itself — use it alongside the main entry
(`import "@flowkit-io/react"`) or `/lean` + `@flowkit-io/react/steps/*`, the same way
`/steps/*` composes with `/lean`.

```tsx
import { useState } from "react"
import { FlowOverlay } from "@flowkit-io/react/overlay"
import { feedbackFlow } from "@flowkit-io/presets"
import "@flowkit-io/react/style.css"

function FeedbackButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Lascia un feedback</button>
      <FlowOverlay
        open={open}
        onOpenChange={setOpen}
        presentation="auto"
        flow={feedbackFlow}
        onSubmit={(answers) => adapter.submit(feedbackFlow.id, answers)}
      />
    </>
  )
}
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `open` | `boolean` | yes | Controlled visibility. `false` fully unmounts the overlay and the inner `FlowRunner` |
| `onOpenChange` | `(open: boolean) => void` | yes | Called with `false` for every dismissal channel (Escape, backdrop, ✕, drawer swipe-down) and, with `closeOnSubmit`, after `onSubmit` resolves. Never called with `true` — your trigger opens it |
| `presentation` | `"drawer" \| "dialog" \| "fullscreen" \| "auto"` | no (default `"auto"`) | `"fullscreen"` = edge-to-edge takeover; `"auto"` = drawer below 640px viewport width, dialog at/above |
| `dismissible` | `boolean` | no (default `true`) | When `false`, Escape / backdrop / swipe-down no longer close it (the close button still does, unless also hidden) |
| `showCloseButton` | `boolean` | no (default `true`) | The ✕ close button. Set `false` for a flow the user must not close from inside (still closable via `onOpenChange` / the `ref`) |
| `showTitle` | `boolean` | no (default `false`) | Show the flow name in the sheet's top-right corner (like the playground status bar); uses `ariaLabel` if given |
| `fixedHeight` | `boolean \| string` | no (default `true`) | `true` gives the drawer/dialog a fixed, phone-portrait-ish height (`--fk-overlay-height`, default `min(88dvh, 780px)`); a string sets it directly (`"600px"`, `"70dvh"`); `false` sizes to content. Ignored for `"fullscreen"` |
| `closeOnSubmit` | `boolean` | no (default `false`) | Call `onOpenChange(false)` after your `onSubmit` promise resolves, instead of keeping the `confirmation` step visible |
| `container` | `HTMLElement` | no (default `document.body`) | Portal target |
| `ariaLabel` | `string` | no (default `flow.title`) | Accessible name for the dialog, and the text shown by `showTitle` |
| `className` / `style` | — | no | Applied to the sheet element |

All `<FlowRunner>` props (`flow`, `theme`, `mode`, `onSubmit`, `onChange`, `onStepChange`,
`initialStep`, `initialAnswers`, `haptics`) are forwarded, and `ref` exposes the
`FlowRunnerHandle` (it reads `null` while the overlay is closed).

Closing fully unmounts the flow, so each open starts fresh — to resume where the user
left off, capture from `onChange`/`onStepChange` and pass `initialStep`/`initialAnswers`
back on the next open (see [Resuming a flow](#resuming-a-flow)).

The ✕ close button shows by default (`showCloseButton`); with `showTitle`, it moves into
a header bar that also carries the flow name on the right. Focus is trapped in the sheet
while open and restored on close, `body` scroll is locked, and `prefers-reduced-motion`
disables the slide/pop animations. The drawer's
swipe-to-dismiss starts from the grabber handle. The drawer and dialog take a fixed
phone-portrait height by default (`fixedHeight`); style it with `--fk-overlay-height`, the
dialog width with `--fk-overlay-dialog-width` (default `440px`), and the stacking layer
with `--fk-overlay-z` (default `1100`) — set them on your theme root or via the `style`
prop. Because
`<FlowOverlay>` composes `<FlowRunner>`, step layouts still respond to the **sheet** width
(container query), not the viewport.

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
