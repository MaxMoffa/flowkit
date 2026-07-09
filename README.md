# Flowkit

Libreria React open source per comporre flow guidati e themeable a partire da un config
dichiarativo (zod). Monorepo pnpm: core headless, renderer React, temi, adapter di
persistenza e preset pronti all'uso.

## Struttura

```
packages/core       # schema Flow/Step (zod), macchina a stati, i18n
packages/react      # <FlowRunner>, ThemeProvider, componenti degli step
packages/themes     # tema notion-clean (token + variabili CSS, light/dark)
packages/adapters   # local (localStorage), rest (fetch), supabase (stub)
packages/presets    # preset "odori" e "feedback"
apps/playground     # app Vite con selettore preset/tema e cornice mobile
```

## Quickstart

```bash
pnpm install
pnpm --filter @flowkit/playground dev
```

Apri l'URL stampato da Vite: il playground mostra il preset selezionato dentro una
cornice mobile (~390px), con selettore tema e toggle chiaro/scuro.

## Usare Flowkit in un'app

```tsx
import { FlowRunner } from "@flowkit/react"
import { notionClean } from "@flowkit/themes"
import { createLocalAdapter } from "@flowkit/adapters"
import { feedbackFlow } from "@flowkit/presets"
import "@flowkit/react/style.css"

const adapter = createLocalAdapter()

function App() {
  return (
    <FlowRunner
      flow={feedbackFlow}
      theme={notionClean}
      mode="light"
      onSubmit={(answers) => adapter.submit(feedbackFlow.id, answers)}
    />
  )
}
```

## I due preset di demo

- **odori** (`@flowkit/presets` → `odoriFlow`): segnalazione di un odore molesto
  (località, tipo, intensità, momento della giornata, note/foto, riepilogo).
- **feedback** (`@flowkit/presets` → `feedbackFlow`): raccolta feedback con faccine,
  NPS, multi-select degli aspetti positivi, email opzionale, riepilogo.

Entrambi sono eseguibili nel playground tramite il selettore "Preset".

## Script

```bash
pnpm lint        # eslint
pnpm typecheck   # tsc --noEmit su tutto il monorepo
pnpm test        # vitest
pnpm build       # build di tutti i pacchetti + playground
pnpm verify      # lint + typecheck + test + build + spec-check
```

## Definire un flow custom

Un flow è un oggetto validato da `@flowkit/core`'s `parseFlow`, con uno `steps[]` che
usa i tipi del registry: `intro`, `location`, `select-cards`, `scale`, `chips`, `faces`,
`notes-photo`, `nps`, `multi-select`, `text`, `review`, `confirmation`. Vedi
`packages/presets/src/odori.ts` per un esempio completo.
