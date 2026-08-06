# @flowkit-io/core

Headless config schema, flow state machine, validation and i18n for Flowkit. This is the foundational package—it defines the flow structure, step types, validation rules, and execution engine without any UI framework dependency.

## Installation and usage in this repo

This package is part of the flowkit monorepo. Install dependencies at the repo root:

```bash
npm install
```

The package is available as `@flowkit-io/core` in workspace imports:

```typescript
import { parseFlow, type Flow } from "@flowkit-io/core"
```

## Main exports

- **`parseFlow(config: FlowConfig)`** – Parse and validate a flow configuration; throws on invalid schema. Returns a normalized `Flow` object.
- **`Flow`** – Type for a validated flow (array of steps, metadata, etc.).
- **Step type configurations** – Schemas and types for each step (e.g., `IntroStep`, `SelectCardsStep`, `NpsStep`). Import from the module (e.g., `import { IntroStep } from "@flowkit-io/core"`).
- **`FlowMachine`** – State machine that orchestrates flow execution: tracks current step, answers, navigation, validation.
- **`registry`** – Step type registry (`registerStepType`, `getStepTypeDefinition`, `listRegisteredStepTypes`). Step types self-register on module load.
- **`i18n`** – Internationalization utilities: `t(locale, key)`, `resolveText(flow, key)`, `defaultMessages`. Built-in locales: `en`, `it`. Each flow specifies its own `locale` field; UI text can be overridden via the flow's `texts` object.
- **Remote data sources** – `RemoteDataSource` type and config for option/select steps to fetch data from endpoints.
- **SmartFill** – Registry and utilities for auto-fill generators (e.g., auto-complete suggestions). Register custom generators via `registerSmartFillGenerator`.
- **OAuth** – Types and helpers (`completeOAuthCallback`, PKCE flow) for OAuth step integration.
- **Other utilities** – `Report` (post-submission report type), `UploadItem` (file upload metadata), geocoding utilities.

## Configuration structure

A flow is defined as a JSON/TypeScript object with steps and metadata. See `src/schema.ts` for the full Zod schema.

**Basic example: Flow structure**

```typescript
import { parseFlow, type Flow } from "@flowkit-io/core"

const myFlow: Flow = parseFlow({
  id: "feedback-form",
  title: "Your Feedback",
  locale: "en",              // Language/locale ("en" or "it"; default: "it")
  timezone: "UTC",           // IANA timezone for date/time steps (default: "UTC")
  disableBack: false,        // Disable back navigation if true
  texts: {                   // Optional: override UI text (buttons, labels, errors)
    continue: "Next",
    submit: "Send Feedback",
  },
  steps: [
    {
      id: "step-1",
      type: "intro",
      key: "welcome",
      title: "Welcome to our feedback form",
      cta: "Start",
    },
    {
      id: "step-2",
      type: "multi-select",
      key: "topics",
      title: "What would you like to tell us about?",
      options: [
        { value: "product", label: "Product" },
        { value: "support", label: "Support" },
        { value: "other", label: "Other" },
      ],
    },
    {
      id: "step-3",
      type: "review",
      key: "review",
      title: "Review your answers",
    },
    {
      id: "step-4",
      type: "confirmation",
      key: "thanks",
      title: "Thank you!",
      message: "Your feedback has been recorded.",
    },
  ],
})
```

**Step types supported:**

- **intro** – Introductory screen with title, subtitle, CTA.
- **select-cards** – Single-select from card-style options.
- **multi-select** – Multi-select from options, with min/max constraints.
- **radio** – Radio-button single select.
- **chips** – Compact single or multi-select chips.

Options on `select-cards`/`multi-select`/`radio`/`chips` accept two optional fields besides `value`/`label`: `description` (helper text shown below the label) and `color` (rendered as a small swatch). Both are backward compatible — omit them and options render exactly as before:

```typescript
options: [
  { value: "product", label: "Product", description: "Bugs, features, general feedback", color: "#2783DE" },
  { value: "support", label: "Support" },
]
```
- **faces** – Single-select from emoji faces (mood/sentiment).
- **scale** – Numeric scale (e.g., 1–10).
- **nps** – Net Promoter Score (0–10 scale with labels).
- **text/email/number** – Text input with variants; email includes validation.
- **notes** – Long-form text area.
- **date-time** – Date/time picker with format options.
- **media** – Media upload/capture (photo, audio, video).
- **file** – File upload.
- **media-display** – Display a static image (read-only, no input).
- **location** – Geolocation picker with map (Google Maps API or Leaflet).
- **location-leaflet** – Geolocation picker with Leaflet.js.
- **checkbox** – Single checkbox (boolean).
- **review** – Summary of all previous answers; read-only.
- **confirmation** – End-of-flow success message.
- **info** – Static informational content.
- **long-content** – Display long-form markdown content.
- **group** – Logical grouping of steps (not directly rendered as UI; used for layout).
- **signature** – Signature capture.
- **oauth** – OAuth sign-in (Google, GitHub, Apple, etc.).
- **payment-stripe** – Stripe payment collection.
- **verification** – Phone/email verification via OTP.
- **booking-slot** – Time slot selection for appointments.
- **branch** – Conditional navigation based on answers.

**Common step fields:**

```typescript
{
  id: string;                    // Unique identifier for navigation
  type: string;                  // Step type (see list above)
  key?: string;                  // Data export key (default: auto-generated from title)
  title?: string;                // Display title
  subtitle?: string;             // Subtitle/description
  required?: boolean;            // Whether an answer is required (default: true)
  image?: {                       // Step image/icon
    kind: "emoji" | "icon" | "image"
    value: string                // emoji, SVG markup, or URL
  }
  contentAlign?: "left" | "center" | "right"  // Alignment
  themeOverride?: Partial<ThemeTokens>        // Per-step theme overrides
}
```

**Remote data sources:**

Steps like `multi-select`, `radio`, `select-cards` can fetch options from a remote endpoint:

```typescript
{
  type: "multi-select",
  key: "countries",
  title: "Select your country",
  dataSource: {
    url: "https://api.example.com/countries",
    labelField: "name",              // JSON field to use as label
    valueField: "code",              // JSON field to use as value
    method: "GET",                   // HTTP method
    headers: {                        // Optional
      "Authorization": "Bearer token"
    },
    dependsOn: ["region"],            // Refetch if these step keys change
    debounce: 300,                    // Debounce search input (ms)
  }
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
npm run test:e2e       # Run Playwright e2e tests
npm run verify:fast    # lint + typecheck + test + build (no e2e)
npm run verify         # lint + typecheck + test + build + e2e
```

## Compatibility and dependencies

- **Runtime:** Node.js 18+ (module: ESM)
- **TypeScript:** 5.0+
- **Dependencies:**
  - **zod** ^3.24.1 – Schema validation
- **Peer dependencies:** None
- **Internal workspace dependencies:** None (this is the base layer)

The package exports CommonJS-compatible `.d.ts` declarations alongside ESM; transpile to your target if needed.

## Notes

- This package is **headless**: no UI, no React, no styling. It provides configuration parsing, state management, and a registry for extensibility.
- Step types are auto-registered on module load (via side effects in `index.ts`), so the registry is immediately available after import.
- The flow machine tracks navigation state, answer history, and validation; it does not render UI (that's @flowkit-io/react's responsibility).
- Custom step types and SmartFill generators can be registered at runtime before creating a flow machine.
- Locales and i18n dictionaries can be customized globally or per-flow via the `i18n` option.
