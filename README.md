# Flowkit

Libreria React open source per comporre flow guidati e themeable a partire da un config
dichiarativo (zod). Monorepo pnpm: core headless, renderer React, temi, adapter di
persistenza e preset pronti all'uso.

## Struttura

```
packages/core       # schema Flow/Step (zod), macchina a stati, i18n
packages/react      # <FlowRunner>, ThemeProvider, componenti degli step
packages/themes     # temi notion-clean, mint-fresh, midnight-ink (token + CSS vars, light/dark)
packages/adapters   # local (localStorage), rest (fetch), supabase (stub)
packages/presets    # preset "odori" e "feedback"
apps/playground     # app Vite: showcase, selettore preset/tema, cornice mobile con notch/statusbar
```

## Quickstart

```bash
pnpm install
pnpm --filter @flowkit/playground dev
```

Apri l'URL stampato da Vite: il playground mostra il preset selezionato dentro una
cornice mobile (~390px) con notch e statusbar, selettore preset/tema, toggle
chiaro/scuro e una strip di swatch per confrontare i tre temi disponibili.

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
  (posizione con mappa, tipo con card a icone, intensità con slider colorato,
  durata, fastidio con faccine, note/foto, riepilogo, conferma con statistiche e
  bottone opzionale "invia via email" per salvare la segnalazione).
- **feedback** (`@flowkit/presets` → `feedbackFlow`): raccolta feedback con faccine,
  NPS, multi-select degli aspetti positivi, email opzionale, riepilogo.

Entrambi sono eseguibili nel playground tramite il selettore "Preset", con qualsiasi
tema tra quelli disponibili in `@flowkit/themes`.

## Invio delle risposte via email

Lo step `confirmation` supporta `emailShare: { enabled, subject?, buttonLabel?, helpText? }`.
Se abilitato, mostra un campo email + bottone che apre il client di posta dell'utente
con oggetto e corpo precompilati dalle risposte del flow — utile per lasciare a chi
compila il flow un modo per salvarsi una copia, senza bisogno di backend.

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
