# Flowkit

Libreria React open source per comporre **flow guidati, mobile-first e themeable** a
partire da un config dichiarativo validato con [zod](https://zod.dev). Pensata per
wizard "una domanda per schermata" come segnalazioni, sondaggi, onboarding e form
multi-step: tu scrivi un oggetto `Flow`, Flowkit lo renderizza, gestisce navigazione e
validazione, e applica il tema.

Monorepo pnpm composto da:

```
packages/core       # schema Flow/Step (zod), macchina a stati, i18n minimale
packages/react      # <FlowRunner>, <ThemeProvider>, componenti per ogni tipo di step
packages/themes     # temi notion-clean, mint-fresh, midnight-ink (token + CSS vars, light/dark)
packages/adapters   # persistenza risposte: local (localStorage), rest (fetch), supabase (stub)
packages/presets    # flow pronti all'uso: "odori" e "feedback"
apps/playground     # app Vite di showcase: preset/tema/dark-mode, cornice mobile
```

Nessuna dipendenza da un framework di stato esterno: il core è headless (nessun DOM,
nessun React), il rendering vive solo in `@flowkit/react`.

---

## Indice

- [Installazione](#installazione)
- [Quickstart: playground](#quickstart-playground)
- [Concetti base](#concetti-base)
- [Usare Flowkit in un'app](#usare-flowkit-in-unapp)
- [Configurare un tema](#configurare-un-tema)
- [Definire un flow](#definire-un-flow)
  - [Campi comuni a ogni step](#campi-comuni-a-ogni-step)
  - [Riferimento per tipo di step](#riferimento-per-tipo-di-step)
- [Invio delle risposte via email](#invio-delle-risposte-via-email)
- [Persistenza delle risposte (adapter)](#persistenza-delle-risposte-adapter)
- [i18n](#i18n)
- [Preset inclusi](#preset-inclusi)
- [Script del monorepo](#script-del-monorepo)
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

`@flowkit/presets` è opzionale: contiene solo esempi pronti, non è richiesto per usare
la libreria con un tuo config.

## Quickstart: playground

```bash
pnpm --filter @flowkit/playground dev
```

Apri l'URL stampato da Vite. La pagina mostra:

- un **selettore Preset** (`odori`, `feedback`);
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
| `Step` | `@flowkit/core` | Una "schermata" del flow: union discriminata su `type` |
| `Answers` | `@flowkit/core` | `Record<stepId, valore>`, lo stato compilato dall'utente |
| `Theme` | `@flowkit/themes` | `{ name, label, light, dark }`, ogni variante è un set di token |
| `FlowRunner` | `@flowkit/react` | Componente React che monta un `Flow`, gestisce stato/navigazione/render |
| `FlowAdapter` | `@flowkit/adapters` | Interfaccia `{ submit, loadDraft, saveDraft }` per persistere le risposte |

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
regole).

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
colori e le misure di base:

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
}
```

Questi token vengono tradotti in variabili CSS (`--fk-*`) da `themeToCssVars` e iniettati
inline sul contenitore `<ThemeProvider>` — nessun CSS-in-JS, nessuna classe generata a
runtime: tutto il resto del CSS (`packages/react/src/style.css`) legge solo `var(--fk-*)`.

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
variabili CSS a mano su un contenitore attorno a `FlowRunner` (hanno la precedenza più
vicina vince, come ogni CSS custom property):

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
themeToCssVars(theme, mode)   // -> Record<"--fk-...", string>, utile per style inline
themeToCssString(theme, mode) // -> stringa "chiave: valore;\n..." per <style> statico
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

`parseFlow` lancia un `ZodError` se il config non rispetta lo schema: usalo sempre in
fase di build/definizione del flow (non su input arbitrario a runtime non fidato).

### Campi comuni a ogni step

Ogni oggetto in `steps[]` — qualunque `type` abbia — accetta questi campi base:

| Campo | Tipo | Default | Descrizione |
|---|---|---|---|
| `id` | `string` | — (obbligatorio) | Identificativo univoco dello step nel flow; chiave in `Answers` |
| `type` | uno dei tipi elencati sotto | — (obbligatorio) | Determina schema aggiuntivo e componente React usato |
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

Sempre `required: true` di fatto ininfluente: l'`intro` non richiede risposta.

```ts
{ id: "intro", type: "intro", title: "Che aria tira?", subtitle: "Segnalalo in 30 secondi.",
  emoji: "👃", cta: "Segnala un odore →", livePill: "34 segnalazioni oggi in zona" }
```

#### `location`

Cattura una posizione testuale. Valore risposta: `string`. Componente: `LocationStepView`.

| Campo | Tipo | Default | Note |
|---|---|---|---|
| `placeholder` | `string` | `"Cerca un indirizzo"` | Placeholder dell'input testuale (usato sempre se `showMap: false`, o dopo il tap su "inserisci manualmente") |
| `showMap` | `boolean` | `true` | Se `true`, mostra una mappa **decorativa** (SVG statico, nessuna integrazione mappe reale) con pin e un riquadro "posizione rilevata" invece dell'input diretto |
| `detectedLabel` | `string` | `"Posizione rilevata"` | Testo mostrato come indirizzo "rilevato" quando `showMap: true`; viene anche usato come valore iniziale della risposta (auto-set al mount, così "Continua" è subito abilitato) |
| `detectedSubLabel` | `string` | — | Riga secondaria sotto `detectedLabel` (es. "Battipaglia (SA) · ±15 m") |
| `manualEntryLabel` | `string` | `"Inserisci un indirizzo manualmente"` | Testo del link che passa dalla mappa decorativa all'input manuale |

Validazione: valida se la stringa non è vuota (dopo `trim`).

```ts
{ id: "location", type: "location", title: "Dove lo senti?",
  showMap: true, detectedLabel: "Via Roma, 24", detectedSubLabel: "Battipaglia (SA) · ±15 m" }
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
| `variant` | `"pills" \| "slider"` | `"pills"` | `"pills"`: una fila di bottoni numerati, uno per valore. `"slider"`: `input[type=range]` con numero grande ed etichetta colorata sopra, in stile mock (auto-inizializzato al valore centrale `(min+max)/2` al mount, cosi il flow non resta bloccato in attesa di un drag) |
| `valueLabels` | `string[]` | — | (solo `slider`) etichetta testuale per ciascun valore, indicizzata da `0` a `max-min` (es. `["Assente", "Molto debole", ...]`) |
| `valueColors` | `string[]` | — | (solo `slider`) colore CSS per ciascun valore, stessa indicizzazione di `valueLabels`; se assente usa una palette verde→arancio→rosso di default |

Validazione: valido se il valore è un `number` (qualunque, anche `min`).

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

Validazione: come `select-cards` (multipla → almeno 1 elemento; singola → stringa non vuota).

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

Comportamento: al mount si autoseleziona la faccina centrale dell'array (così se lo
step è `required: false`, come nel preset odori, non serve comunque forzare una scelta
per procedere, ma il riepilogo mostra sempre un valore sensato di default).

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

Validazione: valido se c'è testo non vuoto **oppure** una foto (irrilevante se `required: false`).

```ts
{ id: "notes", type: "notes-photo", title: "Vuoi aggiungere altro?", required: false,
  allowPhoto: true, placeholder: "Es. l'odore aumenta quando tira vento da nord…" }
```

#### `nps`

Net Promoter Score, 0–10. Valore risposta: `number`. Componente: `NpsStepView`
(riusa lo stesso stile a pillole di `scale`).

| Campo | Tipo | Default | Note |
|---|---|---|---|
| `question` | `string` | — | Testo domanda esteso, es. "Quanto è probabile che ci consiglieresti...?" |

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

Validazione: `arr.length >= min` e (se impostato) `arr.length <= max`.

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
| `multiline` | `boolean` | `false` | (riservato per usi futuri con textarea; al momento il componente usa comunque un `<input>`) |

```ts
{ id: "email", type: "text", title: "Vuoi essere ricontattato?", required: false,
  variant: "email", placeholder: "nome@esempio.com" }
```

#### `review`

Riepilogo automatico di tutte le risposte date finora (esclude `intro`, `review` e
`confirmation`). Non richiede una risposta propria: è sempre l'ultimo step "attivo"
prima della `confirmation`, e il suo bottone diventa "Invia segnalazione ✓" (invoca
`onSubmit` di `FlowRunner`). Componente: `ReviewStepView`.

| Campo | Tipo | Default | Note |
|---|---|---|---|
| `meta` | `string` | — | Banner informativo sopra il riepilogo (es. "🌬️ Aggiungeremo automaticamente meteo e direzione del vento") |

Il riepilogo risolve automaticamente `value → label` per gli step `select-cards`,
`chips`, `multi-select` e `faces`, usando le rispettive `options`/`faces` — non serve
duplicare le label a mano.

```ts
{ id: "review", type: "review", title: "Tutto pronto?", subtitle: "Controlla e invia la tua segnalazione.",
  meta: "🌬️ Aggiungeremo automaticamente meteo e direzione del vento" }
```

#### `confirmation`

Schermata finale, senza header/progress bar; footer con due bottoni ("nuova
segnalazione" e "torna alla home", entrambi di default riavviano il flow lato client).
Componente: `ConfirmationStepView`.

| Campo | Tipo | Default | Note |
|---|---|---|---|
| `title` | `string` | `"Grazie!"` | — |
| `message` | `string` | — | Sottotitolo |
| `emoji` | `string` | — | Se presente sostituisce l'icona di spunta di default dentro il cerchio verde |
| `stats` | `{ value, label }[]` | — | Righe di statistiche mostrate in box affiancati (es. `{ value: "35", label: "segnalazioni oggi in zona" }`) |
| `primaryCta` / `secondaryCta` | `string` | `"Torna alla home"` / `"Nuova segnalazione"` | Testi dei due bottoni footer |
| `emailShare` | oggetto, vedi sotto | — | Abilita il bottone "invia le risposte via email" |

Vedi la sezione dedicata qui sotto per `emailShare`.

```ts
{ id: "confirmation", type: "confirmation", title: "Grazie!",
  message: "La tua segnalazione è stata registrata.",
  stats: [{ value: "35", label: "segnalazioni oggi in zona" }, { value: "#12", label: "la tua di oggi" }] }
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
posta predefinito dell'utente (`window.location.href = mailto:...`).

Non c'è invio server-side: è l'utente finale a scegliere se e come completare l'invio
dal proprio client — un modo semplice per lasciargli "salvare" una copia della propria
compilazione senza bisogno di backend o SMTP lato tuo.

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

Se non ti serve, ometti del tutto `emailShare` (o lascia `enabled: false`): il bottone
semplicemente non compare.

## Persistenza delle risposte (adapter)

`@flowkit/adapters` espone la stessa interfaccia (`FlowAdapter`) per tre backend diversi:

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

`submit` accoda la risposta in un array salvato sotto `${namespace}:submissions:${flowId}`
e ripulisce l'eventuale bozza. Utile per demo, prototipi, o flow che non hanno bisogno
di un backend.

### `createRestAdapter` — endpoint HTTP

```ts
import { createRestAdapter } from "@flowkit/adapters"

const adapter = createRestAdapter({
  baseUrl: "https://api.tuodominio.it",
  headers: { Authorization: "Bearer ..." }, // opzionale
  fetchImpl: myFetch,                        // opzionale, default fetch globale
})
```

`submit` fa `POST ${baseUrl}/flows/${flowId}/submissions` con `answers` come body JSON e
lancia se la risposta non è `ok`. Le bozze (`loadDraft`/`saveDraft`) restano solo in
memoria (non persistite lato server) — se ti serve autosave server-side, scrivi un
adapter dedicato (vedi sotto).

### `createSupabaseAdapter` — stub Supabase

```ts
import { createSupabaseAdapter } from "@flowkit/adapters"
import { createClient } from "@supabase/supabase-js"

const client = createClient(url, key)
const adapter = createSupabaseAdapter({ client, table: "flow_submissions" /* default */ })
```

Il pacchetto **non dipende** da `@supabase/supabase-js`: passi tu un client già
inizializzato che rispetti l'interfaccia minima `SupabaseClientLike` (un metodo
`.from(table).insert(row)`). `submit` inserisce `{ flow_id, answers }` nella tabella.

### Scrivere un adapter custom

Basta implementare l'interfaccia `FlowAdapter`:

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
`Flow`: se ti serve un flow multilingua, definisci config paralleli per locale (non c'è
al momento un meccanismo di traduzione automatica delle stringhe del `Flow`).

## Preset inclusi

`@flowkit/presets` contiene due flow pronti, utili sia come demo sia come esempio di
come comporre tutti i tipi di step:

- **`odoriFlow`** (`packages/presets/src/odori.ts`) — segnalazione di un odore molesto:
  `intro` → `location` (con mappa) → `select-cards` (tipo, 6 categorie a icone) →
  `scale` slider (intensità 0–6, colorata) → `chips` (durata) → `faces` (fastidio,
  opzionale) → `notes-photo` (note/foto, opzionale) → `review` (con banner meteo) →
  `confirmation` (con statistiche e bottone email).
- **`feedbackFlow`** (`packages/presets/src/feedback.ts`) — raccolta feedback:
  `intro` → `faces` (umore) → `nps` → `multi-select` (aspetti positivi) → `text` email
  (opzionale) → `review` → `confirmation`.

```ts
import { odoriFlow, feedbackFlow } from "@flowkit/presets"
```

Usali come riferimento diretto: copia lo step che ti interessa e adattalo, non serve
ripartire da zero per capire la forma di un config valido.

## Script del monorepo

```bash
pnpm lint        # eslint su tutto il monorepo
pnpm typecheck   # tsc --noEmit (usa i sorgenti dei pacchetti via `paths`, non i dist)
pnpm test        # vitest (test del core: macchina a stati, validazione)
pnpm build       # build di tutti i pacchetti (tsup) + playground (vite build)
pnpm verify      # lint + typecheck + test + build + scripts/spec-check.mjs
```

`pnpm verify` è il gate di "definizione di fatto" del progetto (vedi `CLAUDE.md`):
deve passare prima di considerare un task completo.

**Nota per chi sviluppa dentro questo monorepo**: `apps/playground` importa i pacchetti
`@flowkit/*` dai rispettivi `dist/` (non dai sorgenti via HMR). Se modifichi
`packages/react`, `packages/core`, `packages/themes` ecc. e vuoi vederne l'effetto nel
playground in dev, devi ribuildare il pacchetto toccato prima di ricaricare la pagina:

```bash
pnpm --filter @flowkit/react --filter @flowkit/core build
```

(`packages/react/src/style.css` fa eccezione: è importato per path diretto, quindi le
modifiche CSS sono live senza rebuild.)

## Estendere Flowkit

- **Nuovo tipo di step**: aggiungi lo schema in `packages/core/src/schema.ts`
  (`z.object({ ...baseStepFields, type: z.literal("il-tuo-tipo"), ... })`), aggiungilo
  all'union `stepSchema`, poi crea il componente in `packages/react/src/steps/` e
  registralo in `packages/react/src/registry.tsx` (`stepRegistry`).
- **Nuovo tema**: crea un file in `packages/themes/src/` con `light`/`dark`
  `ThemeTokens` (vedi [Configurare un tema](#configurare-un-tema)) e aggiungilo alla
  mappa `themes` in `packages/themes/src/index.ts` — oppure, se non ti serve
  contribuirlo al pacchetto, costruisci l'oggetto `Theme` direttamente nella tua app e
  passalo a `FlowRunner` senza toccare questo repo.
- **Nuovo adapter**: implementa `FlowAdapter` (vedi sopra), nessuna modifica al core o
  al renderer richiesta.
