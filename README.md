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
implemented** in this version.

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

## Quickstart

```bash
npm install
npm run dev --workspace=@flowkit-io/playground
```

```tsx
import { FlowRunner } from "@flowkit-io/react"
import { notionClean } from "@flowkit-io/themes"
import { createLocalAdapter } from "@flowkit-io/adapters"
import { feedbackFlow } from "@flowkit-io/presets"
import "@flowkit-io/react/style.css"

const adapter = createLocalAdapter()

function App() {
  return (
    <FlowRunner
      flow={feedbackFlow}
      theme={notionClean}
      onSubmit={(answers) => adapter.submit(feedbackFlow.id, answers)}
    />
  )
}
```

## Documentation

Full docs live in [`docs/`](./docs/README.md):

- [Installation](./docs/installation.md)
- [CLI: `create-flowkit` and `flowkit-init`](./docs/cli.md)
- [Quickstart: playground](./docs/quickstart.md)
- [Core concepts](./docs/core-concepts.md)
- [Using Flowkit in an app](./docs/using-flowkit.md)
- [Custom steps](./docs/custom-steps.md)
- [Configuring a theme](./docs/theming.md)
- [Defining a flow / reference by step type](./docs/steps-reference.md)
- [OAuth step](./docs/oauth-step.md)
- [Map step (maplibre-gl / Leaflet)](./docs/map-step.md)
- [Result actions (email, PDF, share, styled report export)](./docs/result-actions.md)
- [Persisting answers (adapters)](./docs/adapters.md)
- [i18n and included presets](./docs/i18n-and-presets.md)
- [Monorepo scripts and end-to-end tests](./docs/development.md)

## License

See [LICENSE](./LICENSE).
