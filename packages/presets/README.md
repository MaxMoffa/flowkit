# @flowkit-io/presets

Ready-made Flowkit flow configs for common use cases (surveys, feedback, registration, etc.). This package provides tested, production-ready flow configurations that can be used as-is or customized.

## Installation and usage in this repo

This package is part of the flowkit monorepo. Install dependencies at the repo root:

```bash
npm install
```

The package is available as `@flowkit-io/presets` in workspace imports:

```typescript
import { feedbackFlow, odoriFlow } from "@flowkit-io/presets"
```

## Main exports

- **`feedbackFlow`** – Post-experience feedback collection with NPS, mood selection, and optional follow-up email.
- **`odoriFlow`** – Smell/air quality reporting preset (Italian). Collects location, smell intensity, and reporter contact.
- **`restaurantFlow`** – Restaurant rating and feedback collection. Captures location, visit type, ratings, and comments.
- **`anagraficaFlow`** – Contact information and registration preset. Collects name, email, phone, address, and consent.

Each preset is a `Flow` object (from @flowkit-io/core) ready to use with `FlowRunner` or to customize.

## Preset details

### feedbackFlow

**Purpose:** Collect general feedback with Net Promoter Score.

**Steps:**
1. Intro – Welcome message ("How did it go?")
2. Faces – Mood/sentiment selection (5 emoji options)
3. NPS – Net Promoter Score (0–10 scale)
4. Multi-select – What did you like most? (Design, Speed, Support, Price)
5. Text (email) – Optional follow-up email address
6. Review – Summary of answers
7. Confirmation – Thank you message

**Customization:**
- Change emoji/colors in intro step's `image` field
- Adjust NPS labels via step's `lowLabel`/`highLabel`
- Add/remove options in multi-select

**Flow ID:** `feedback` | **Locale:** Italian

### odoriFlow

**Purpose:** Report unpleasant smells in an area (crowdsourced air quality mapping).

**Steps:**
1. Intro – Welcome with live report count
2. Location – Geolocation picker (address auto-fill, manual entry)
3. Scale – Smell intensity (1–5 scale)
4. Faces – Emotional response to smell
5. Multi-select – Type of smell (chemical, organic, other)
6. Text (optional) – Additional comments
7. Review – Summary
8. Confirmation – Thank you

**Customization:**
- Replace emoji in location step (default: 📍)
- Adjust scale labels and range
- Change smell type options
- Update geolocation provider (default: Google Geocoding API)

**Flow ID:** `odori` | **Locale:** Italian

### restaurantFlow

**Purpose:** Capture restaurant visit feedback and ratings.

**Steps:**
1. Intro – Welcome to restaurant feedback
2. Location – Restaurant location/address
3. Radio – Type of visit (dine-in, takeout, delivery)
4. Scale (multiple) – Rating for food, service, ambience
5. Multi-select – Tags (quiet, kid-friendly, romantic, etc.)
6. Text (optional) – Additional comments
7. Review – Summary
8. Confirmation – Thank you

**Customization:**
- Add/remove rating scales
- Change visit type options
- Customize environment tags
- Update location geocoding

**Flow ID:** `restaurant` | **Locale:** Italian

### anagraficaFlow

**Purpose:** Collect contact information and preferences.

**Steps:**
1. Intro – Welcome to registration
2. Text – Full name
3. Text (email) – Email address
4. Text – Phone number (optional)
5. Location – Address
6. Checkbox – Privacy/consent agreement
7. Review – Confirm details
8. Confirmation – Registration complete

**Customization:**
- Add/remove fields (LinkedIn, company, etc.)
- Update privacy text
- Change email validation rules
- Add conditional logic based on answers

**Flow ID:** `anagrafica` | **Locale:** Italian

## Basic example

```typescript
import { feedbackFlow } from "@flowkit-io/presets"
import { FlowRunner } from "@flowkit-io/react"
import { notionClean } from "@flowkit-io/themes"

export function FeedbackApp() {
  const handleSubmit = async (answers: Record<string, any>) => {
    console.log("Feedback received:", answers)
    // Send to backend, Notion, email, etc.
    await fetch("/api/feedback", {
      method: "POST",
      body: JSON.stringify(answers),
    })
  }

  return (
    <FlowRunner
      flow={feedbackFlow}  // Note: presets are in Italian (locale: "it")
      theme={notionClean}
      onSubmit={handleSubmit}
    />
  )
}
```

## Customizing a preset

Presets are plain JavaScript objects; customize by spreading and overriding fields:

```typescript
import { parseFlow } from "@flowkit-io/core"
import { feedbackFlow } from "@flowkit-io/presets"

const customizedFeedback = parseFlow({
  ...feedbackFlow,
  title: "Help us improve!",    // Override title
  steps: feedbackFlow.steps.map((step) => {
    // Change NPS step
    if (step.type === "nps") {
      return {
        ...step,
        title: "How likely are you to refer us?",
        lowLabel: "Not at all likely",
        highLabel: "Extremely likely",
      }
    }
    return step
  }),
})

export function App() {
  return <FlowRunner flow={customizedFeedback} onSubmit={handleSubmit} />
}
```

## Using presets with adapters

Pair presets with adapters from @flowkit-io/adapters to handle submissions:

```typescript
import { feedbackFlow } from "@flowkit-io/presets"
import { createRestAdapter } from "@flowkit-io/adapters"

const adapter = createRestAdapter({
  url: "https://api.example.com/feedback",
  headers: { "Authorization": "Bearer api-key" },
})

export function App() {
  const handleSubmit = async (answers) => {
    // Send to backend
    await adapter.submit(answers, { flowId: "feedback" })
  }

  return <FlowRunner flow={feedbackFlow} onSubmit={handleSubmit} />
}
```

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
npm run verify:fast    # lint + typecheck + test + build (no e2e)
npm run verify         # lint + typecheck + test + build + e2e
```

## Compatibility and dependencies

- **Runtime:** Node.js 18+ (module: ESM, no side effects)
- **TypeScript:** 5.0+
- **Dependencies:**
  - **@flowkit-io/core** ^0.13.0 – Flow schema and utilities
- **Peer dependencies:** None
- **Internal workspace dependencies:**
  - @flowkit-io/core

## Notes

- All presets are **validated** via `parseFlow()` at definition time; they are guaranteed to be valid Flowkit flows.
- Presets are authored in **Italian** (locale: "it") by default. Customize text by spreading the preset and overriding the `locale` and `texts` fields on the Flow object.
- Presets can be fully customized: spread, modify steps, add conditional logic (branch steps), or use as inspiration for your own flows.
- Each preset is a complete, self-contained flow; they include intro, collection steps, review, and confirmation by design.
- Presets are ideal for rapid prototyping and as starting points for domain-specific flows (e.g., customer feedback, registration, NPS surveys).
