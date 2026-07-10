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

Libreria open source per comporre **flow guidati, mobile-first e themeable** a partire
da un config dichiarativo validato con [zod](https://zod.dev). Pensata per wizard "una
domanda per schermata" come segnalazioni, sondaggi, onboarding e form multi-step: tu
scrivi un oggetto `Flow`, Flowkit lo renderizza, gestisce navigazione e validazione, e
applica il tema.

**Stato multi-framework**: il core (`@flowkit/core`), i temi (`@flowkit/themes`) e gli
adapter (`@flowkit/adapters`) sono framework-agnostic per design. Il renderer
**React** (`@flowkit/react`) è completo e coperto da test automatici (unità + Playwright
end-to-end). I renderer **Vue, Svelte e vanilla JS sono pianificati ma non ancora
implementati** in questa versione — la CLI e questa documentazione trattano oggi solo
React; le sezioni relative agli altri framework torneranno quando i pacchetti
corrispondenti esisteranno.

Monorepo pnpm composto da:

```
packages/core            # schema Flow/Step (zod), registry step aperto, macchina a stati, oauth, geocoding, i18n
packages/react            # <FlowRunner>, <ThemeProvider>, componenti per ogni tipo di step (incl. oauth, mappa reale)
packages/themes            # temi notion-clean, mint-fresh, midnight-ink (token + CSS vars, light/dark, font/immagini)
packages/adapters           # persistenza risposte: local, rest, supabase (stub), notion
packages/presets              # flow pronti all'uso: "odori" e "feedback"
packages/create-flowkit         # CLI: `create-flowkit` (scaffold) e `flowkit-init` (installer)
apps/playground                   # app Vite di showcase: preset/tema/dark-mode, cornice mobile
e2e/                                 # test Playwright end-to-end (solo target React per ora)
```

Nessuna dipendenza da un framework di stato esterno: il core è headless (nessun DOM),
il rendering vive solo nel pacchetto del framework scelto (oggi: `@flowkit/react`).

---

## Indice

- [Installazione](#installazione)
- [CLI: `create-flowkit` e `flowkit-init`](#cli-create-flowkit-e-flowkit-init)
- [Quickstart: playground](#quickstart-playground)
- [Concetti base](#concetti-base)
- [Usare Flowkit in un'app](#usare-flowkit-in-unapp)
- [Step personalizzati](#step-personalizzati)
- [Configurare un tema](#configurare-un-tema)
- [Definire un flow](#definire-un-flow)
  - [Campi comuni a ogni step](#campi-comuni-a-ogni-step)
  - [Riferimento per tipo di step](#riferimento-per-tipo-di-step)
- [Step OAuth](#step-oauth)
- [Step Mappa (maplibre-gl)](#step-mappa-maplibre-gl)
- [Invio delle risposte via email](#invio-delle-risposte-via-email)
- [Persistenza delle risposte (adapter)](#persistenza-delle-risposte-adapter)
- [i18n](#i18n)
- [Preset inclusi](#preset-inclusi)
- [Script del monorepo](#script-del-monorepo)
- [Test end-to-end (Playwright)](#test-end-to-end-playwright)
- [Estendere Flowkit](#estendere-flowkit)

---

## Installazione

Requisiti: Node 18+ e [pnpm](https://pnpm.io) (usato dal monorepo per i workspace).

```bash
pnpm install
```

Se consumi Flowkit da un altro progetto (non da questo monorepo), installa i pacchetti
che ti servono dal registry dove li hai pubblicati:

```bash
pnpm add @flowkit/core @flowkit/react @flowkit/themes @flowkit/adapters
```

> **Nota**: i pacchetti `@flowkit/*` non sono ancora pubblicati su un registry pubblico
> in questa fase del progetto (tutti `"private": true`). Gli esempi di installazione
> sopra e la CLI sotto sono scritti per il momento in cui verranno pubblicati; nel
> frattempo, per usarli da un altro progetto locale, punta alle cartelle dei pacchetti
> con il protocollo `file:` (es. `"@flowkit/core": "file:../flowkit/packages/core"`).

`@flowkit/presets` è opzionale: contiene solo esempi pronti, non è richiesto per usare
la libreria con un tuo config.

## CLI: `create-flowkit` e `flowkit-init`

Il pacchetto `packages/create-flowkit` espone due comandi (solo target **React** in
questa versione; gli altri framework verranno accettati dal prompt ma ricondotti a
React con un avviso, in attesa dei rispettivi pacchetti renderer):

### `create-flowkit` — scaffold di una mini-app

Crea un progetto Vite+React standalone, già wired con `@flowkit/presets` (preset
`feedback`), tema di default e adapter `local` — nessun backend richiesto per partire.

```bash
npx create-flowkit
# oppure, non interattivo (utile in CI/script):
npx create-flowkit --name my-app --framework react --yes
```

Prompt: nome progetto, framework. Poi: copia il template, rinomina `package.json`,
installa le dipendenze (a meno di `--no-install`), stampa i comandi per partire
(`cd my-app && npm run dev`).

### `flowkit-init` — aggiungi Flowkit a un progetto esistente

```bash
npx flowkit-init
# oppure, non interattivo:
npx flowkit-init --framework react --yes
```

Rileva il package manager del progetto (pnpm/yarn/npm dal lockfile presente),
installa `@flowkit/core` + `@flowkit/themes` + `@flowkit/adapters` + il pacchetto del
framework scelto, e scrive un file `src/flowkit-setup.tsx` con il wiring minimo
(`FlowRunner` vuoto pronto da riempire) — non un preset intero.

Entrambi i comandi accettano `--no-install` (salta l'installazione, stampa il comando
da eseguire a mano) e sono scriptabili end-to-end con `--framework`/`--name`/`--yes`,
perché i prompt interattivi (`@clack/prompts`) richiedono un vero terminale e non
funzionano pipando stdin.

## Quickstart: playground

```bash
pnpm --filter @flowkit/playground dev
```

Apri l'URL stampato da Vite. La pagina mostra:

- un **selettore Preset** (`odori`, `feedback`, più due demo: step personalizzati e
  OAuth+Mappa);
- un **selettore Tema** (`notion-clean`, `mint-fresh`, `midnight-ink`);
- un **toggle chiaro/scuro**;
- il flow renderizzato dentro una **cornice telefono** con notch e statusbar, i cui
  colori seguono il tema attivo;
- una **strip di swatch** per confrontare i temi a colpo d'occhio;
- un pannello di debug con il JSON delle risposte inviate (`onSubmit`).

Usalo come riferimento visivo prima di scrivere il tuo config: è il modo più veloce
per capire come i vari tipi di step si comportano.

## Concetti base

| Concetto | Dove vive | Cos'è |
|---|---|---|
| `Flow` | `@flowkit/core` | Oggetto validato da zod: `{ id, title, locale, steps[] }` |
| `Step` | `@flowkit/core` | Una "schermata" del flow; il `type` è risolto a runtime da un **registry** (vedi [Step personalizzati](#step-personalizzati)), non da una union chiusa |
| `Answers` | `@flowkit/core` | `Record<stepId, valore>`, lo stato compilato dall'utente |
| `Theme` | `@flowkit/themes` | `{ name, label, light, dark }`, ogni variante è un set di token (colori, spaziature, font, immagini) |
| `FlowRunner` | `@flowkit/react` | Componente React che monta un `Flow`, gestisce stato/navigazione/render |
| `FlowAdapter` | `@flowkit/adapters` | Interfaccia `{ submit, loadDraft, saveDraft }` per persistere le risposte (local/rest/supabase/notion) |

Il flusso tipico: scrivi un `Flow` con `parseFlow(...)`, lo passi a `<FlowRunner>` insieme
a un `Theme` e a un `onSubmit`, e quando l'utente arriva allo step `review` e conferma,
ricevi `Answers` già validate secondo le regole `required` di ogni step.

## Usare Flowkit in un'app

```tsx
import { FlowRunner } from "@flowkit/react"
import { notionClean } from "@flowkit/themes"
import { createLocalAdapter } from "@flowkit/adapters"
import { feedbackFlow } from "@flowkit/presets"
import "@flowkit/react/style.css" // stili base dei componenti (fk-*), obbligatorio

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

Props di `FlowRunner` (`packages/react/src/FlowRunner.tsx`):

| Prop | Tipo | Obbligatoria | Descrizione |
|---|---|---|---|
| `flow` | `Flow` | sì | Il config del flow, tipicamente il risultato di `parseFlow(...)` |
| `theme` | `Theme` | no (default `notionClean`) | Tema da applicare, vedi sezione temi |
| `mode` | `"light" \| "dark"` | no (default `"light"`) | Variante del tema da usare |
| `onSubmit` | `(answers) => void \| Promise<void>` | no | Chiamata quando l'utente conferma lo step `review` (prima di passare alla `confirmation`) |
| `onChange` | `(answers) => void` | no | Chiamata a ogni risposta modificata — utile per autosave/bozze |

`FlowRunner` non renderizza header/progress bar/bottone Continua sugli step `intro` e
`confirmation` (comportamento "hero", niente chrome), mentre per tutti gli altri step
mostra automaticamente: bottone indietro, barra di progresso, contatore `n/m` e footer
con il bottone primario (abilitato solo quando lo step corrente è valido secondo le sue
regole). Ogni step viene montato con `key={step.id}`: due step consecutivi dello stesso
`type` (es. due step `location`) restano istanze React indipendenti, non condividono
stato interno né side-effect DOM (es. istanze mappa).

`<FlowRunner>` avvolge tutto in un `<ThemeProvider>` interno: se ti serve applicare il
tema a un layout più ampio (es. per stilizzare anche elementi tuoi attorno al flow),
puoi usare `<ThemeProvider>` direttamente:

```tsx
import { ThemeProvider } from "@flowkit/react"
import { midnightInk } from "@flowkit/themes"

<ThemeProvider theme={midnightInk} mode="dark">
  {/* qualunque markup con classi fk-* erediterà le variabili CSS del tema */}
</ThemeProvider>
```

## Step personalizzati

Il `type` di uno step non è più una union chiusa: `@flowkit/core` espone un **registry
runtime** (`registerStepType`) e `@flowkit/react` il corrispondente registry di
componenti (`registerStepComponent`). I 12 step built-in si registrano da soli
all'import del pacchetto — aggiungerne uno nuovo non richiede toccare `schema.ts` né
`registry.tsx`.

```ts
// 1. Schema + validazione (agnostico da framework, in un file qualsiasi della tua app)
import { z } from "zod"
import { registerStepType } from "@flowkit/core"

const ratingStarsStepSchema = z.object({
  id: z.string().min(1),
  type: z.literal("rating-stars"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  required: z.boolean().default(true),
  icon: z.string().optional(), // convenzione: includi i campi base come i built-in
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
// 2. Componente React
import { registerStepComponent, type StepComponentProps } from "@flowkit/react"

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
// 3. Lo step compare nel flow config come un tipo qualunque
{ id: "rating", type: "rating-stars", title: "Quante stelle dai?", maxStars: 5 }
```

**Type-safety opzionale**: `Step` è calcolato da un'interfaccia `StepTypeMap`
aumentabile via TypeScript module augmentation. Se vuoi che `Step` includa il tuo tipo
custom a livello di tipi (narrowing completo, niente cast), aumenta la mappa:

```ts
declare module "@flowkit/core" {
  interface StepTypeMap {
    "rating-stars": RatingStarsStep
  }
}
```

Senza questa dichiarazione lo step funziona comunque a runtime (validato dal registry),
ma va castato a `Step` quando lo inserisci in un array `steps[]` tipizzato. Vedi un
esempio completo funzionante in `apps/playground/src/custom-step-demo.tsx` (preset
"Step custom (demo)" nel playground).

## Configurare un tema

Un tema (`packages/themes/src/index.ts`) ha questa forma:

```ts
export interface Theme {
  name: string   // slug univoco, es. "notion-clean"
  label: string  // etichetta leggibile per UI di selezione, es. "Notion Clean"
  light: ThemeTokens
  dark: ThemeTokens
}
```

`ThemeTokens` (`packages/themes/src/notion-clean.ts`) è l'unico posto dove vivono i
colori, le misure di base e (opzionalmente) font/immagini:

```ts
export interface ThemeTokens {
  text: string        // colore testo primario
  text2: string       // colore testo secondario (sottotitoli, label)
  canvas: string      // sfondo principale (bianco/nero a seconda del mode)
  soft: string        // sfondo "soft" per card/input non enfatizzati
  surface: string     // sfondo per superfici leggermente più marcate (track progress)
  border: string      // colore bordi
  accent: string       // colore di accento (bottoni primari, selezioni)
  accentSoft: string   // tinta chiara dell'accento (badge, card selezionate)
  success: string      // verde semantico
  successSoft: string
  warning: string      // arancio semantico
  warningSoft: string
  danger: string       // rosso semantico
  dangerSoft: string
  radiusSm: string     // raggio bordi piccolo (es. bottone back, pill numeriche)
  radiusMd: string     // raggio bordi medio (card, bottoni, input)
  radiusLg: string     // raggio bordi grande (mappa, review box)
  radiusXl: string     // raggio bordi extra (badge landing)
  spacing: Record<"xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl", string>
  fonts?: {              // opzionale: personalizzazione tipografica
    heading?: string
    body?: string
    headingSize?: string
    bodySize?: string
    headingFontUrl?: string  // URL di un font-face/stylesheet da iniettare
    bodyFontUrl?: string
  }
  images?: {             // opzionale: personalizzazione immagini
    background?: string          // sfondo globale del flow
    stepBackground?: Record<string, string> // sfondo per id/type di step specifico
    logo?: string
  }
}
```

Questi token vengono tradotti in variabili CSS (`--fk-*`) da `themeToCssVars` e iniettati
inline sul contenitore `<ThemeProvider>` — nessun CSS-in-JS, nessuna classe generata a
runtime: tutto il resto del CSS (`packages/react/src/style.css`) legge solo `var(--fk-*)`.
`fonts`/`images` sono additivi: se assenti, il comportamento CSS è identico a prima
della loro introduzione.

### Font e immagini custom

```ts
const myTheme: Theme = {
  name: "brand",
  label: "Brand",
  light: {
    ...notionClean.light,
    fonts: {
      heading: "'Fraunces', serif",
      body: "'Inter', sans-serif",
      headingFontUrl: "https://fonts.example/fraunces.css",
      bodyFontUrl: "https://fonts.example/inter.css",
    },
    images: { background: "/brand-bg.jpg", logo: "/brand-logo.svg" },
  },
  dark: notionClean.dark,
}
```

`@flowkit/themes` espone `injectThemeFontLinks(theme, mode)` (ritorna gli URL dei font
da caricare): il pacchetto themes resta framework-agnostic, quindi l'iniezione del vero
`<link rel="stylesheet">` nel DOM è responsabilità dell'app host (o di un renderer come
`@flowkit/react`, in una versione futura con supporto integrato).

### Creare un tema custom

Non serve modificare `@flowkit/themes`: basta costruire un oggetto `Theme` compatibile
e passarlo a `FlowRunner`.

```ts
import type { Theme } from "@flowkit/themes"

export const brandTheme: Theme = {
  name: "brand",
  label: "Brand",
  light: {
    text: "#1A1A1A",
    text2: "#6B6B6B",
    canvas: "#FFFFFF",
    soft: "#F7F7F5",
    surface: "#EFEFEC",
    border: "#E2E2DE",
    accent: "#FF5A36",
    accentSoft: "#FFEAE3",
    success: "#2FA35E",
    successSoft: "#E3F5E8",
    warning: "#D89B3C",
    warningSoft: "#FBF0DC",
    danger: "#E0615A",
    dangerSoft: "#FBE6E4",
    radiusSm: "10px",
    radiusMd: "14px",
    radiusLg: "20px",
    radiusXl: "28px",
    spacing: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", xxl: "32px", xxxl: "48px" },
  },
  dark: {
    /* stessa forma, valori per la modalità scura */
    text: "#F2F2F0", text2: "#A0A0A0", canvas: "#141414", soft: "#1C1C1C",
    surface: "#242424", border: "#333333", accent: "#FF7A5C", accentSoft: "#3A2018",
    success: "#4CCB86", successSoft: "#16301F", warning: "#E4AC5C", warningSoft: "#332815",
    danger: "#EC7B74", dangerSoft: "#332120",
    radiusSm: "10px", radiusMd: "14px", radiusLg: "20px", radiusXl: "28px",
    spacing: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", xxl: "32px", xxxl: "48px" },
  },
}
```

```tsx
<FlowRunner flow={myFlow} theme={brandTheme} mode="light" />
```

Se vuoi solo **override puntuali** senza creare un intero tema, puoi anche impostare le
variabili CSS a mano su un contenitore attorno a `FlowRunner`:

```css
.my-wrapper {
  --fk-accent: #ff5a36;
  --fk-radius-md: 10px;
}
```

```tsx
<div className="my-wrapper">
  <FlowRunner flow={myFlow} theme={notionClean} />
</div>
```

### Helper disponibili in `@flowkit/themes`

```ts
themeToCssVars(theme, mode)      // -> Record<"--fk-...", string>, utile per style inline
themeToCssString(theme, mode)    // -> stringa "chiave: valore;\n..." per <style> statico
injectThemeFontLinks(theme, mode) // -> string[] di URL font da iniettare (vedi sopra)
```

### Temi inclusi

| `name` | `label` | Palette |
|---|---|---|
| `notion-clean` | Notion Clean | Neutro caldo, accento blu `#2783DE` (default) |
| `mint-fresh` | Mint Fresh | Neutro verde, accento verde smeraldo `#16A87E` |
| `midnight-ink` | Midnight Ink | Neutro violaceo, accento indaco `#6753E0` |

```ts
import { themes, notionClean, mintFresh, midnightInk } from "@flowkit/themes"

Object.entries(themes) // [["notion-clean", notionClean], ["mint-fresh", mintFresh], ["midnight-ink", midnightInk]]
```

## Definire un flow

Un `Flow` si costruisce con `parseFlow` (valida con zod e applica i default):

```ts
import { parseFlow, type Flow } from "@flowkit/core"

export const myFlow: Flow = parseFlow({
  id: "my-flow",       // id univoco, usato dagli adapter per raggruppare le risposte
  title: "Il mio flow", // titolo, mostrato ad es. nella statusbar del playground
  locale: "it",          // opzionale, default "it"
  steps: [
    /* ... */
  ],
})
```

`parseFlow` lancia un errore descrittivo se un `type` non è registrato, o un `ZodError`
se il config non rispetta lo schema del tipo: usalo sempre in fase di build/definizione
del flow (non su input arbitrario a runtime non fidato).

### Campi comuni a ogni step

Ogni oggetto in `steps[]` — qualunque `type` abbia — accetta questi campi base:

| Campo | Tipo | Default | Descrizione |
|---|---|---|---|
| `id` | `string` | — (obbligatorio) | Identificativo univoco dello step nel flow; chiave in `Answers` |
| `type` | `string` | — (obbligatorio) | Determina schema aggiuntivo e componente usato, risolti a runtime dal registry |
| `title` | `string` | — | Titolo (`<h1>`/`<h2>` a seconda dello step) |
| `subtitle` | `string` | — | Sottotitolo/descrizione sotto il titolo |
| `required` | `boolean` | `true` | Se `false`, lo step è sempre considerato valido: il bottone "Continua" non si blocca in attesa di una risposta |
| `icon` | `string` (emoji) | — | Icona mostrata nella riga di riepilogo dello step `review` (se assente, viene usata un'icona di default in base al `type`) |

L'ordine di `steps[]` è l'ordine di navigazione. Non esiste un concetto di step
condizionale/ramificazione: se ti serve, componi flow diversi e scegli quale montare
a runtime (come fa il playground con il selettore Preset).

### Riferimento per tipo di step

#### `intro`

Schermata "hero" iniziale, senza header/progress bar. Componente: `IntroStepView`.

| Campo | Tipo | Default | Note |
|---|---|---|---|
| `emoji` | `string` | — | Emoji mostrata in un badge arrotondato sopra il titolo |
| `cta` | `string` | `"Inizia"` | Testo del bottone primario in footer |
| `livePill` | `string` | — | Se presente, mostra una pillola con pallino verde animato sopra il badge (es. "34 segnalazioni oggi in zona") |

```ts
{ id: "intro", type: "intro", title: "Che aria tira?", subtitle: "Segnalalo in 30 secondi.",
  emoji: "👃", cta: "Segnala un odore →", livePill: "34 segnalazioni oggi in zona" }
```

#### `location`

Cattura una posizione geografica su una **mappa reale** (maplibre-gl). Valore risposta:
`{ lat, lng, address?, regionId?, pointId? }` (o `string`, per retro-compatibilità con
flow scritti prima della v2.8). Componente: `LocationStepView`. Vedi la sezione dedicata
[Step Mappa](#step-mappa-maplibre-gl) per la config completa (`selectionMode`, stile
mappa, geocoding).

| Campo | Tipo | Default | Note |
|---|---|---|---|
| `placeholder` | `string` | `"Cerca un indirizzo"` | Placeholder della barra di ricerca indirizzo |
| `showMap` | `boolean` | `true` | Riservato per retro-compatibilità; la mappa reale è sempre mostrata |
| `detectedSubLabel` | `string` | — | Riga secondaria sotto l'indirizzo/coordinate selezionate |
| `styleUrl` | `string` | stile demo pubblico maplibre | URL dello stile mappa, sostituibile |
| `geocodingEndpoint` | `string` | endpoint pubblico Nominatim | Endpoint di ricerca luoghi, sostituibile (es. server self-hosted) |
| `selectionMode` | vedi [Step Mappa](#step-mappa-maplibre-gl) | `{ kind: "point" }` | Cosa significa "selezionare" sulla mappa |
| `initialCenter` | `{ lat, lng, zoom? }` | Roma, zoom 11 | Centro/zoom iniziali della mappa |
| `extraMarkers` | `{ lat, lng, label? }[]` | — | Marker decorativi aggiuntivi, non selezionabili |

```ts
{ id: "location", type: "location", title: "Dove lo senti?",
  subtitle: "Cerca un indirizzo o clicca direttamente sulla mappa." }
```

#### `select-cards`

Griglia 2 colonne di card selezionabili (con emoji + label + descrizione opzionale).
Valore risposta: `string` (singola) o `string[]` (`multiple: true`). Componente:
`SelectCardsStepView`.

| Campo | Tipo | Default | Note |
|---|---|---|---|
| `multiple` | `boolean` | `false` | Selezione singola o multipla |
| `options` | `{ value, label, emoji?, description? }[]` | — (min 1) | Opzioni della griglia |

Validazione: se `multiple`, richiede almeno un elemento; altrimenti una stringa non vuota.

```ts
{ id: "smell-type", type: "select-cards", title: "Che tipo di odore?", multiple: false,
  options: [
    { value: "sewage", label: "Fognario", emoji: "🥚", description: "Uova marce, zolfo" },
    { value: "chemical", label: "Chimico", emoji: "🧪", description: "Solventi, vernici" },
  ] }
```

#### `scale`

Valutazione numerica su un range. Valore risposta: `number`. Componente: `ScaleStepView`.
Due varianti visive:

| Campo | Tipo | Default | Note |
|---|---|---|---|
| `min` / `max` | `number` | `1` / `5` | Estremi del range (inclusivi) |
| `minLabel` / `maxLabel` | `string` | — | Etichette agli estremi (sotto ai pill o allo slider) |
| `variant` | `"pills" \| "slider"` | `"pills"` | `"pills"`: una fila di bottoni numerati, uno per valore. `"slider"`: `input[type=range]` con numero grande ed etichetta colorata sopra (auto-inizializzato al valore centrale `(min+max)/2` al mount) |
| `valueLabels` | `string[]` | — | (solo `slider`) etichetta testuale per ciascun valore, indicizzata da `0` a `max-min` |
| `valueColors` | `string[]` | — | (solo `slider`) colore CSS per ciascun valore, stessa indicizzazione di `valueLabels`; se assente usa una palette verde→arancio→rosso di default |

```ts
// variante slider (es. intensità di un odore, 0-6)
{ id: "intensity", type: "scale", title: "Quanto è forte?", variant: "slider",
  min: 0, max: 6, minLabel: "0 · Assente", maxLabel: "6 · Estremo",
  valueLabels: ["Assente", "Molto debole", "Debole", "Distinto", "Forte", "Molto forte", "Estremo"],
  valueColors: ["#7D7A75", "#46A171", "#46A171", "#D5803B", "#D5803B", "#E56458", "#E56458"] }

// variante pills (es. valutazione 1-5)
{ id: "rating", type: "scale", title: "Voto complessivo", min: 1, max: 5,
  minLabel: "Scarso", maxLabel: "Ottimo" }
```

#### `chips`

Fila di pillole selezionabili (wrap su più righe). Valore risposta: `string` o
`string[]` (`multiple: true`). Componente: `ChipsStepView`.

| Campo | Tipo | Default | Note |
|---|---|---|---|
| `multiple` | `boolean` | `true` | Selezione singola o multipla |
| `options` | `{ value, label }[]` | — (min 1) | Opzioni |

```ts
{ id: "duration", type: "chips", title: "Da quanto lo senti?", multiple: false,
  options: [
    { value: "lt5", label: "< 5 min" }, { value: "5-30", label: "5–30 min" },
    { value: "gt30", label: "> 30 min" }, { value: "persistent", label: "Persistente" },
  ] }
```

#### `faces`

Fila di emoji-faccine selezionabili (scala edonica). Valore risposta: `string`.
Componente: `FacesStepView`.

| Campo | Tipo | Default | Note |
|---|---|---|---|
| `faces` | `{ value, emoji, label? }[]` | 5 faccine standard (😞🙁😐🙂😄) | Se `label` è assente, viene mostrata solo l'emoji |

Comportamento: al mount si autoseleziona la faccina centrale dell'array.

```ts
{ id: "hedonic", type: "faces", title: "Quanto è fastidioso?", required: false,
  faces: [
    { value: "1", emoji: "😊" }, { value: "2", emoji: "😐" }, { value: "3", emoji: "😕" },
    { value: "4", emoji: "🤢" }, { value: "5", emoji: "🤮" },
  ] }
```

#### `notes-photo`

Textarea opzionale + upload foto. Valore risposta: `{ text?: string, photo?: string }`
(il campo `photo` è una data-URL letta via `FileReader`, tutto client-side). Componente:
`NotesPhotoStepView`.

| Campo | Tipo | Default | Note |
|---|---|---|---|
| `allowPhoto` | `boolean` | `true` | Mostra o nasconde il box di upload foto |
| `placeholder` | `string` | `"Scrivi qui..."` | Placeholder della textarea |

```ts
{ id: "notes", type: "notes-photo", title: "Vuoi aggiungere altro?", required: false,
  allowPhoto: true, placeholder: "Es. l'odore aumenta quando tira vento da nord…" }
```

#### `nps`

Net Promoter Score, 0–10. Valore risposta: `number`. Componente: `NpsStepView`.

| Campo | Tipo | Default | Note |
|---|---|---|---|
| `question` | `string` | — | Testo domanda esteso |

```ts
{ id: "nps", type: "nps", title: "Ci consiglieresti?",
  question: "Quanto è probabile che ci consiglieresti a un amico o collega?" }
```

#### `multi-select`

Selezione multipla generica (checklist), con vincoli min/max. Valore risposta:
`string[]`. Componente: `MultiSelectStepView`.

| Campo | Tipo | Default | Note |
|---|---|---|---|
| `options` | `{ value, label }[]` | — (min 1) | Opzioni |
| `min` | `number` | `0` | Numero minimo di selezioni richieste |
| `max` | `number` | — | Numero massimo di selezioni consentite |

```ts
{ id: "highlights", type: "multi-select", title: "Cosa ti è piaciuto di più?", min: 0,
  options: [
    { value: "speed", label: "Velocità" }, { value: "support", label: "Assistenza" },
  ] }
```

#### `text`

Input libero testo/numero/email. Valore risposta: `string`. Componente: `TextStepView`.

| Campo | Tipo | Default | Note |
|---|---|---|---|
| `variant` | `"text" \| "number" \| "email"` | `"text"` | Cambia validazione: `"email"` richiede un formato email valido, `"number"` richiede che il valore sia convertibile con `Number(...)` |
| `placeholder` | `string` | — | Placeholder dell'input |
| `multiline` | `boolean` | `false` | (riservato per usi futuri con textarea) |

```ts
{ id: "email", type: "text", title: "Vuoi essere ricontattato?", required: false,
  variant: "email", placeholder: "nome@esempio.com" }
```

#### `oauth`

Step di autenticazione via redirect OAuth. Vedi la sezione dedicata
[Step OAuth](#step-oauth).

#### `review`

Riepilogo automatico di tutte le risposte date finora (esclude `intro`, `review` e
`confirmation`). Il suo bottone diventa "Invia segnalazione ✓" (invoca `onSubmit` di
`FlowRunner`). Componente: `ReviewStepView`.

| Campo | Tipo | Default | Note |
|---|---|---|---|
| `meta` | `string` | — | Banner informativo sopra il riepilogo |

```ts
{ id: "review", type: "review", title: "Tutto pronto?", subtitle: "Controlla e invia la tua segnalazione.",
  meta: "🌬️ Aggiungeremo automaticamente meteo e direzione del vento" }
```

#### `confirmation`

Schermata finale, senza header/progress bar; footer con due bottoni. Componente:
`ConfirmationStepView`.

| Campo | Tipo | Default | Note |
|---|---|---|---|
| `title` | `string` | `"Grazie!"` | — |
| `message` | `string` | — | Sottotitolo |
| `emoji` | `string` | — | Se presente sostituisce l'icona di spunta di default |
| `stats` | `{ value, label }[]` | — | Righe di statistiche in box affiancati |
| `primaryCta` / `secondaryCta` | `string` | `"Torna alla home"` / `"Nuova segnalazione"` | Testi dei due bottoni footer |
| `emailShare` | oggetto, vedi sotto | — | Abilita il bottone "invia le risposte via email" |

```ts
{ id: "confirmation", type: "confirmation", title: "Grazie!",
  message: "La tua segnalazione è stata registrata.",
  stats: [{ value: "35", label: "segnalazioni oggi in zona" }, { value: "#12", label: "la tua di oggi" }] }
```

## Step OAuth

Step di tipo `oauth`: mostra un bottone per ciascun provider abilitato, che al click fa
un **redirect completo** verso l'authorize URL del provider (PKCE incluso dove
richiesto). La libreria **non esegue mai lo scambio codice→token**: costruisce solo
l'URL di redirect; il completamento del flow OAuth (parsing della redirect URI,
chiamata al token endpoint) è responsabilità dell'app host.

```ts
{
  id: "login",
  type: "oauth",
  title: "Accedi per continuare",
  required: false,
  providers: [
    {
      id: "google",              // "google" | "github" | "facebook" | id custom
      clientId: "IL_TUO_CLIENT_ID",
      redirectUri: "https://tuo-dominio.it/oauth/callback",
      scopes: ["profile", "email"],
      usePkce: true,              // default true, genera code_verifier/code_challenge via Web Crypto
    },
    {
      id: "generic",               // provider non noto: authorizeUrl obbligatorio
      clientId: "...",
      authorizeUrl: "https://provider-custom.example.com/oauth/authorize",
      redirectUri: "https://tuo-dominio.it/oauth/callback",
    },
  ],
}
```

Provider noti con authorize URL preimpostato: `google`, `github`, `facebook` (solo URL
pubblici, nessun segreto). Per un provider non elencato, usa `id: "generic"` (o un id
a tua scelta) con `authorizeUrl` esplicito.

**Completare il login** dopo il redirect, lato app host:

```ts
import { completeOAuthCallback } from "@flowkit/core"

// nella pagina di ritorno (redirectUri), leggendo query string o hash:
const result = completeOAuthCallback("google", window.location.search)
// result: { providerId, code?, token?, state? }

// poi, a scelta:
// 1) scambia `code` per un token lato tuo backend (mai nel browser: richiederebbe il client secret)
// 2) passa `result` come value dello step oauth (es. tramite onChange di FlowRunner,
//    riprendendo lo stato del flow dove l'avevi lasciato prima del redirect)
```

`generatePkcePair()`/`buildAuthorizeUrl(provider, pkce?)` sono esportati da
`@flowkit/core` se ti serve costruire l'URL manualmente al di fuori dello step.

## Step Mappa (maplibre-gl)

Step di tipo `location`: mappa reale renderizzata con
[maplibre-gl](https://maplibre.org/), ricerca luoghi (geocoding, default
[Nominatim/OSM](https://nominatim.org)), selezione configurabile.

```ts
{
  id: "pick-spot",
  type: "location",
  title: "Scegli un punto sulla mappa",
  styleUrl: "https://demotiles.maplibre.org/style.json",  // sostituibile con un tuo stile
  geocodingEndpoint: "https://nominatim.openstreetmap.org/search", // sostituibile (server self-hosted, altro provider)
  selectionMode: { kind: "point" },  // default
  initialCenter: { lat: 41.9, lng: 12.5, zoom: 11 },
}
```

### `selectionMode`: cosa significa "selezionare"

```ts
type SelectionMode =
  | { kind: "point" }                                              // default: pin libero, draggable
  | { kind: "region"; regions: GeoJSONFeature[] }                    // click dentro un poligono → regionId
  | { kind: "preset-points"; points: { id, label, lat, lng }[] }     // click su un punto fisso → pointId
```

- **`point`** (default): click/drag sulla mappa posiziona un marker draggable, `value`
  diventa `{ lat, lng }`.
- **`preset-points`**: mostra un marker per ciascun punto della lista; click su un
  marker imposta `value: { lat, lng, pointId }`.
- **`region`**: click dentro uno dei poligoni GeoJSON forniti imposta
  `value: { regionId }` (point-in-polygon calcolato client-side, nessuna dipendenza
  esterna tipo turf).

### Personalizzazione del rendering

- **Dichiarativa** (resta nel config, serializzabile): `extraMarkers` aggiunge marker
  decorativi non selezionabili.
- **Override totale** (marker custom con logica, hook a funzione): non passa dal
  config JSON (che deve restare serializzabile), ma dal pattern "wrap del componente
  registrato di default" — registra un tuo componente per `"location"` che internamente
  usa `LocationStepView` e gli passa prop dirette:

```tsx
import { registerStepComponent, LocationStepView } from "@flowkit/react"

function CustomLocationView(props) {
  // aggiungi qui logica/hook non serializzabili, poi delega al default:
  return <LocationStepView {...props} />
}

registerStepComponent("location", CustomLocationView)
```

## Invio delle risposte via email

Lo step `confirmation` accetta un campo opzionale:

```ts
emailShare?: {
  enabled: boolean          // default false — nessun bottone se assente/false
  subject?: string          // oggetto della mail, default il title della confirmation
  buttonLabel?: string      // default "Invia via email"
  helpText?: string         // riga descrittiva sopra il campo email
}
```

Se `enabled: true`, la schermata di conferma mostra un campo email + bottone: al click,
il componente costruisce un link `mailto:<email>?subject=...&body=...` con il corpo
generato a partire da **tutte le risposte del flow** (`answers`) e apre il client di
posta predefinito dell'utente.

Non c'è invio server-side: è l'utente finale a scegliere se e come completare l'invio
dal proprio client.

```ts
{
  id: "confirmation",
  type: "confirmation",
  title: "Grazie!",
  emailShare: {
    enabled: true,
    subject: "La mia segnalazione odore",
    buttonLabel: "Invia via email",
    helpText: "Vuoi salvare una copia della tua segnalazione? Ricevila via email.",
  },
}
```

## Persistenza delle risposte (adapter)

`@flowkit/adapters` espone la stessa interfaccia (`FlowAdapter`) per quattro backend
diversi:

```ts
export interface FlowAdapter {
  submit(flowId: string, answers: Answers): Promise<void>
  loadDraft(flowId: string): Promise<Answers | null>
  saveDraft(flowId: string, answers: Answers): Promise<void>
}
```

### `createLocalAdapter` — localStorage

```ts
import { createLocalAdapter } from "@flowkit/adapters"

const adapter = createLocalAdapter({
  namespace: "flowkit-playground", // prefisso delle chiavi in storage, default "flowkit"
  storage: window.localStorage,     // opzionale, per iniettare uno Storage compatibile (es. in test)
})
```

### `createRestAdapter` — endpoint HTTP

```ts
import { createRestAdapter } from "@flowkit/adapters"

const adapter = createRestAdapter({
  baseUrl: "https://api.tuodominio.it",
  headers: { Authorization: "Bearer ..." }, // opzionale
  fetchImpl: myFetch,                        // opzionale, default fetch globale
})
```

`submit` fa `POST ${baseUrl}/flows/${flowId}/submissions`. Le bozze restano solo in
memoria (non persistite lato server).

### `createSupabaseAdapter` — stub Supabase

```ts
import { createSupabaseAdapter } from "@flowkit/adapters"
import { createClient } from "@supabase/supabase-js"

const client = createClient(url, key)
const adapter = createSupabaseAdapter({ client, table: "flow_submissions" /* default */ })
```

Il pacchetto **non dipende** da `@supabase/supabase-js`: passi tu un client già
inizializzato che rispetti l'interfaccia minima `SupabaseClientLike`.

### `createNotionAdapter` — pagine in un database Notion

```ts
import { createNotionAdapter } from "@flowkit/adapters"

const adapter = createNotionAdapter({
  token: process.env.NOTION_TOKEN!,   // integration token, mai hardcoded
  databaseId: "il-tuo-database-id",
  mapAnswersToProperties: (answers, flowId) => ({ /* mapping custom, opzionale */ }),
})
```

`submit` crea (o aggiorna, se esiste una bozza) una pagina nel database Notion
configurato, via chiamate REST dirette (nessuna dipendenza da `@notionhq/client`).
Mapping di default: stringa → `rich_text`, numero → `number`, array → `multi_select`,
altro → JSON in `rich_text`. Notion non ha un concetto nativo di bozza: `loadDraft`/
`saveDraft` operano su una pagina con property booleana `draft`, filtrata per property
`flowId` (rich_text) — nessuno storage locale, ogni lettura/scrittura passa dall'API
Notion. Il database Notion di destinazione deve avere (almeno) le property `flowId`
(testo) e `draft` (checkbox), oltre a una property per ciascuna risposta che vuoi
mappare (o un `mapAnswersToProperties` custom).

### Scrivere un adapter custom

```ts
import type { FlowAdapter } from "@flowkit/adapters"

export function createMyAdapter(): FlowAdapter {
  return {
    async submit(flowId, answers) { /* ... */ },
    async loadDraft(flowId) { return null },
    async saveDraft(flowId, answers) { /* ... */ },
  }
}
```

## i18n

`@flowkit/core` espone un piccolo dizionario per le stringhe di navigazione generiche:

```ts
import { t } from "@flowkit/core"

t("it", "next")     // "Avanti"
t("en", "back")     // "Back"
```

Copre solo `next`, `back`, `submit`, `required` (locale `it`/`en`, fallback su `it`).
I testi di dominio (titoli, sottotitoli, label delle opzioni...) restano parte del tuo
`Flow`: se ti serve un flow multilingua, definisci config paralleli per locale.

## Preset inclusi

`@flowkit/presets` contiene due flow pronti, utili sia come demo sia come esempio di
come comporre tutti i tipi di step:

- **`odoriFlow`** (`packages/presets/src/odori.ts`) — segnalazione di un odore molesto:
  `intro` → `location` (mappa reale) → `select-cards` (tipo, 6 categorie a icone) →
  `scale` slider (intensità 0–6, colorata) → `chips` (durata) → `faces` (fastidio,
  opzionale) → `notes-photo` (note/foto, opzionale) → `review` (con banner meteo) →
  `confirmation` (con statistiche e bottone email).
- **`feedbackFlow`** (`packages/presets/src/feedback.ts`) — raccolta feedback:
  `intro` → `faces` (umore) → `nps` → `multi-select` (aspetti positivi) → `text` email
  (opzionale) → `review` → `confirmation`.

```ts
import { odoriFlow, feedbackFlow } from "@flowkit/presets"
```

Il playground include anche due demo aggiuntive (non pacchetti a sé, solo esempi in
`apps/playground/src`): **"Step custom (demo)"** (`custom-step-demo.tsx`, vedi
[Step personalizzati](#step-personalizzati)) e **"OAuth + Mappa (demo)"**
(`features-demo.tsx`, step `oauth` + due varianti di step `location`).

## Script del monorepo

```bash
pnpm lint        # eslint su tutto il monorepo
pnpm typecheck   # tsc --noEmit (usa i sorgenti dei pacchetti via `paths`, non i dist)
pnpm test        # vitest (unit test: core, themes, adapters, react registry, CLI)
pnpm build       # build di tutti i pacchetti (tsup) + playground (vite build)
pnpm verify      # lint + typecheck + test + build + scripts/spec-check.mjs
pnpm test:e2e    # Playwright, non incluso in `verify` (più lento, richiede browser)
```

`pnpm verify` è il gate di "definizione di fatto" del progetto (vedi `CLAUDE.md`):
deve passare prima di considerare un task completo. `pnpm test:e2e` gira separatamente
(anche in CI, workflow dedicato) perché comporta build+preview del playground e
avvio di un browser: più lento, non pensato per il ciclo rapido di `verify`.

**Nota per chi sviluppa dentro questo monorepo**: `apps/playground` importa i pacchetti
`@flowkit/*` dai rispettivi `dist/` (non dai sorgenti via HMR). Se modifichi
`packages/react`, `packages/core`, `packages/themes` ecc. e vuoi vederne l'effetto nel
playground in dev, devi ribuildare il pacchetto toccato prima di ricaricare la pagina:

```bash
pnpm --filter @flowkit/react --filter @flowkit/core build
```

(`packages/react/src/style.css` fa eccezione: è importato per path diretto, quindi le
modifiche CSS sono live senza rebuild.)

## Test end-to-end (Playwright)

`e2e/` (root, non dentro un pacchetto) contiene la suite Playwright, target React per
ora:

- `flow-parity.spec.ts` — naviga i preset `odori`/`feedback` end-to-end fino alla
  `confirmation`.
- `theme-visual.spec.ts` — screenshot baseline della schermata intro per i 3 temi
  (`--update-snapshots` per rigenerarle dopo una modifica intenzionale allo stile).
- `oauth-step.spec.ts` — intercetta il redirect OAuth e verifica i parametri
  dell'authorize URL (`client_id`, `redirect_uri`, PKCE).
- `map-step.spec.ts` — mappa reale: selezione `point` via click, `preset-points` via
  marker, ricerca geocoding reale (Nominatim).
- `cli-scaffold.spec.ts` — lancia `flowkit-init`/`create-flowkit` in una cartella
  temporanea, in modalità non interattiva (`--framework react --no-install`), e
  ispeziona i file generati.

```bash
pnpm --filter @flowkit/create-flowkit build   # necessario prima di cli-scaffold.spec.ts
npx playwright install chromium               # una tantum
pnpm test:e2e
```

Gira anche in CI (`.github/workflows/e2e.yml`), separato dal gate di `verify`
(`.github/workflows/ci.yml`).

## Estendere Flowkit

- **Nuovo tipo di step**: vedi [Step personalizzati](#step-personalizzati) —
  `registerStepType` (core) + `registerStepComponent` (react), nessuna modifica ai
  file del pacchetto richiesta.
- **Nuovo tema**: crea un file in `packages/themes/src/` con `light`/`dark`
  `ThemeTokens` (vedi [Configurare un tema](#configurare-un-tema)) e aggiungilo alla
  mappa `themes` in `packages/themes/src/index.ts` — oppure, se non ti serve
  contribuirlo al pacchetto, costruisci l'oggetto `Theme` direttamente nella tua app e
  passalo a `FlowRunner` senza toccare questo repo.
- **Nuovo adapter**: implementa `FlowAdapter` (vedi sopra), nessuna modifica al core o
  al renderer richiesta.
- **Nuovo framework renderer** (Vue/Svelte/vanilla, pianificati): riusa
  `@flowkit/core`/`@flowkit/themes`/`@flowkit/adapters` invariati; replica il contratto
  `StepComponentProps` (`step`/`value`/`onChange` o equivalente/`flow`/`answers`) e il
  pattern registry (`registerStepComponent`/`getStepComponent`) visto in
  `packages/react/src/registry.tsx`.
