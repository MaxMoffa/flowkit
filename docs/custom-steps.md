# Custom steps

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

## Custom intro/confirmation (`role`)

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

## Extending Flowkit

- **New step type**: see above — `registerStepType` (core) + `registerStepComponent`
  (react), no changes to package files required.
- **New theme**: create a file in `packages/themes/src/` with `light`/`dark`
  `ThemeTokens` (see [Configuring a theme](./theming.md)) and add it to the
  `themes` map in `packages/themes/src/index.ts` — or, if you don't need to contribute
  it to the package, build the `Theme` object directly in your app and pass it to
  `FlowRunner` without touching this repo.
- **New adapter**: implement `FlowAdapter` (see [Persisting answers](./adapters.md)),
  no changes to the core or renderer required.
- **New framework renderer** (Vue/Svelte/vanilla, planned): reuse `@flowkit-io/core`/
  `@flowkit-io/themes`/`@flowkit-io/adapters` unchanged; replicate the `StepComponentProps`
  contract (`step`/`value`/`onChange` or equivalent/`flow`/`answers`) and the registry
  pattern (`registerStepComponent`/`getStepComponent`) seen in
  `packages/react/src/registry.tsx`.

Back to the [docs index](./README.md).
