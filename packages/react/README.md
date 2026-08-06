# @flowkit-io/react

React renderer and step components for Flowkit. This package provides pre-built UI components for every step type, a themeable flow runner, and a registry for custom step components.

## Installation and usage in this repo

This package is part of the flowkit monorepo. Install dependencies at the repo root:

```bash
npm install
```

The package is available as `@flowkit-io/react` in workspace imports:

```typescript
import { FlowRunner } from "@flowkit-io/react"
import "@flowkit-io/react/style.css"
```

## Main exports

- **`FlowRunner`** – React component that renders a flow. Props: `flow`, `onSubmit`, `onStepChange`, `theme`, `locale`, `initialStep`, `initialAnswers`, plus optional styling and validation config. Ref-based imperative API via `FlowRunnerHandle` for programmatic navigation.
- **`ThemeProvider`** – Context provider to set the active theme and light/dark mode globally; wraps a `FlowRunner` or app.
- **`stepRegistry`** – Instance of the step component registry. Use `getStepComponent(type)` to look up a component by step type.
- **`registerStepComponent(type, component)`** – Register a custom step component (advanced).
- **`getStepComponent(type)`** – Retrieve a step component by type name.
- **`registerProgressComponent(variant, component)`** – Register a custom progress/stepper variant.
- **`getProgressComponent(variant)`** – Retrieve a progress component by name.
- **`FlowMarkdown`** – React component to render step descriptions with allowed markdown (bold, italic, links, lists). Sanitized for safety.
- **`stripMarkdownToPlainText(markdown)`** – Strip markdown formatting to plain text.
- **`renderReceiptEmailHtml(options)`** – Render a post-submission receipt email as HTML.
- **`renderAnswersReportHtml(options)`** – Render a summary report of answers as HTML.

## Built-in step components

When you import from the main entry (`@flowkit-io/react`), 18 step types are registered automatically:

intro, select-cards, scale, chips, faces, notes, media, file, media-display, date-time, nps, multi-select, radio, text (includes email/number variants), checkbox, review, confirmation, oauth, group, signature, booking-slot, branch, info, long-content

Optional step types (must be imported separately to avoid bloating the bundle):
- **location** – Geolocation picker with Google Maps API: `import "@flowkit-io/react/map-maplibre"`
- **location-leaflet** – Geolocation picker with Leaflet.js: `import "@flowkit-io/react/map-leaflet"`
- **payment-stripe** – Stripe payment collection: `import "@flowkit-io/react/payment-stripe"`
- **verification** – Phone/email verification via OTP: `import "@flowkit-io/react/verification"`

If you prefer to register only the steps you use, import from the lean entry and selectively import steps:

```typescript
import { FlowRunner } from "@flowkit-io/react/lean"
import "@flowkit-io/react/steps/intro"
import "@flowkit-io/react/steps/text"
import "@flowkit-io/react/steps/confirmation"
```

## Progress/stepper variants

Three built-in progress indicators are registered:
- **bar** – Horizontal progress bar
- **dots** – Dot indicators (one per step)
- **steps** – Step list with titles and completion status

The progress variant is controlled by the theme's `layout.progressVariant` token (default: `bar`). Override in a custom theme or per-step via `themeOverride`.

## Configuration options

**FlowRunner props:**

```typescript
export interface FlowRunnerProps {
  flow: Flow                              // Validated flow from @flowkit-io/core
  theme?: Theme                           // Theme object (see @flowkit-io/themes)
  mode?: "light" | "dark"                 // Theme mode (default: "light")
  initialStep?: string                    // Start at a specific step ID
  initialAnswers?: Record<string, any>    // Pre-fill answers
  onStepChange?: (step: CurrentStepInfo) => void  // Called when current step changes
  onSubmit?: (answers: Record<string, any>, report: Report) => void | Promise<void>  // Submission handler
  onChange?: (answers: Record<string, any>) => void  // Called when answers change
}
```

**CurrentStepInfo payload (passed to onStepChange):**

```typescript
{
  id: string                              // Step ID
  type: string                            // Step type
  title: string | null                    // Display title (null if not set)
  index: number                           // Position in step list (0-indexed)
  total: number | null                    // Total steps (null if not available)
  previousStep: PreviousStepSummary | null  // Info about the previous step (id, type, title, index)
  direction: "initial" | "next" | "prev" | "jump" | "branch-change"  // How this step was reached
}
```

**FlowRunnerHandle (ref):**

```typescript
const flowRef = useRef<FlowRunnerHandle>(null)

// Available methods:
flowRef.current?.currentStep        // Read-only: current step info
flowRef.current?.goToStep(stepId)   // Jump to a specific step (returns boolean)
flowRef.current?.getAnswers()       // Get current answers
flowRef.current?.setAnswers(answers) // Replace all answers
flowRef.current?.reset()            // Reset flow to initial state
```

## Basic example

```typescript
import React, { useRef } from "react"
import { FlowRunner, type FlowRunnerHandle } from "@flowkit-io/react"
import { ThemeProvider } from "@flowkit-io/react"
import { notionClean } from "@flowkit-io/themes"
import { parseFlow } from "@flowkit-io/core"
import "@flowkit-io/react/style.css"

const myFlow = parseFlow({
  id: "my-flow",
  title: "Customer Feedback",
  steps: [
    {
      id: "intro",
      type: "intro",
      key: "welcome",
      title: "Welcome!",
      cta: "Start",
    },
    {
      id: "rating",
      type: "nps",
      key: "rating",
      title: "How likely are you to recommend us?",
    },
    {
      id: "confirmation",
      type: "confirmation",
      key: "thanks",
      title: "Thank you!",
    },
  ],
})

export function MyFlowApp() {
  const flowRef = useRef<FlowRunnerHandle>(null)

  const handleSubmit = async (answers: Record<string, any>) => {
    console.log("Flow submitted:", answers)
    // Send to backend, analytics, etc.
  }

  const handleStepChange = (step: any) => {
    console.log(`Entered step: ${step.id} (${step.index + 1}/${step.total})`)
  }

  return (
    <ThemeProvider theme={notionClean} mode="light">
      <FlowRunner
        ref={flowRef}
        flow={myFlow}
        theme={notionClean}
        mode="light"
        onSubmit={handleSubmit}
        onStepChange={handleStepChange}
      />
    </ThemeProvider>
  )
}
```

## Styling

The package includes a base stylesheet:

```typescript
import "@flowkit-io/react/style.css"
```

Themes apply CSS variables (e.g., `--fk-accent`, `--fk-text`, `--fk-canvas`) which the stylesheet uses. Theme tokens are defined in @flowkit-io/themes.

## Development and test commands

From the package directory:

```bash
npm run build          # Build with tsup (ESM + TypeScript declarations)
```

From the repo root:

```bash
npm run lint           # Lint all packages
npm run typecheck      # Type-check all packages
npm run test           # Run all tests (unit + integration)
npm run test:e2e       # Run Playwright e2e tests
npm run verify:fast    # lint + typecheck + test + build (no e2e)
npm run verify         # lint + typecheck + test + build + e2e
```

## Compatibility and dependencies

- **React:** 18.3.1+ or 19.0.0+
- **TypeScript:** 5.0+
- **Dependencies:**
  - **@flowkit-io/core** ^0.13.0 – Flow schema and state machine
  - **@flowkit-io/themes** ^0.4.0 – Theme tokens and utilities
  - **dompurify** ^3.4.12 – Markdown and HTML sanitization
- **Peer dependencies:**
  - **react** ^18.3.1 || ^19.0.0
  - **react-dom** ^18.3.1 || ^19.0.0
- **Optional peer dependencies (install only if using these features):**
  - **maplibre-gl** ^4.7.1 – For `location-leaflet` step
  - **leaflet** ^1.9.4 – For `location-leaflet` step
  - **@stripe/stripe-js** ^9.0.0 – For `payment-stripe` step
  - **@stripe/react-stripe-js** ^6.0.0 – For `payment-stripe` step
- **Internal workspace dependencies:**
  - @flowkit-io/core
  - @flowkit-io/themes

## Notes

- All step components are self-contained and handle their own state management via the flow machine (from @flowkit-io/core).
- Custom step components can be registered via `registerStepComponent(type, component)` before rendering; they receive `StepComponentProps` (step config, answers, validation errors, callbacks).
- Progress variants can be customized via `registerProgressComponent(variant, component)`.
- The markdown renderer supports a limited subset (bold, italic, links, lists) for safety; script/form tags and event handlers are stripped.
- Optional step types (location-leaflet, payment-stripe, verification) are published as separate entry points (`@flowkit-io/react/map-leaflet`, etc.) and must be imported explicitly to avoid bloating the main bundle.
