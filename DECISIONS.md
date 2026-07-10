# Decisioni

Note delle scelte prese in autonomia (lavoro headless, nessuna domanda all'utente).

- **Package manager build**: pnpm non era installato nell'ambiente; installato via
  `npm install -g pnpm` (corepack non aveva permessi per il symlink globale).
- **Composite TS project references**: abbandonato l'approccio `tsc -b` con progetti
  composite — creava conflitti con la generazione dei `.d.ts` di tsup (TS6307). Il
  typecheck root usa `tsc --noEmit` con `paths` che puntano ai sorgenti dei pacchetti
  (`@flowkit/core` → `packages/core/src/index.ts`, ecc.), mentre ogni pacchetto ha un
  proprio `tsconfig.json` semplice usato solo da tsup per il build/dts.
  Ordine di `pnpm verify`: typecheck prima del build, quindi i `dist/*.d.ts` non esistono
  ancora al momento del typecheck — da qui la necessità dei `paths`.
  esbuild richiede approvazione build script pnpm: impostato `allowBuilds.esbuild: true`
  in `pnpm-workspace.yaml`.
- **Step "text/number/email"**: un solo componente step (`text`) con `variant` zod enum
  (`text | number | email`), non tre step separati, per rispettare la lista step del
  registry in CLAUDE.md (`text`, non `number`/`email` a parte).
- **Adapter supabase**: stub che richiede un client Supabase già inizializzato passato
  dal consumer (niente dipendenza diretta da `@supabase/supabase-js` nel pacchetto).
- **Review step**: ora risolve value→label per select-cards/chips/multi-select/faces
  usando le option del proprio step, per mostrare testo leggibile nel riepilogo.
- **Parità grafica mock odori (v1.1)**: il mock HTML statico compone location+intensità+
  durata+hedonic in un'unica schermata; nel flow engine restano step separati (uno per
  screen del wizard) per coerenza con l'architettura a step. Estetica (colori, radius,
  spaziature, slider colorato, card grid, faces, review box, check di conferma) replicata
  1:1 nei token tema e nel CSS di `@flowkit/react`.
- **Slider intensità**: nuovo `scale.variant: "pills" | "slider"`. La variante slider
  usa `valueLabels`/`valueColors` per riprodurre il numero grande + etichetta colorata
  del mock; si autoinizializza al valore centrale (min+max)/2 al mount così il bottone
  "Continua" non resta bloccato in attesa di un drag esplicito.
- **Step "faces" (hedonic)**: si autoseleziona la faccia centrale al mount (comportamento
  del mock, che preseleziona 😕), pur restando `required:false` di default.
- **Location step**: quando `showMap:true` mostra una mappa decorativa (SVG statico, non
  una vera integrazione mappe — fuori scope) con riga "posizione rilevata" e link per
  passaggio a inserimento manuale; l'indirizzo rilevato si autoimposta come risposta.
- **Invio email delle risposte**: niente backend/SMTP. Il bottone "Invia via email"
  in confirmation apre `mailto:` con oggetto/corpo precompilati dalle risposte —
  è l'utente finale a scegliere il proprio client di posta per "salvare" la
  segnalazione. Abilitabile per flow via `confirmationStep.emailShare.enabled`.
- **Temi extra**: aggiunti `mint-fresh` e `midnight-ink` (stessa forma di `notion-clean`,
  con varianti light/dark) per dimostrare che il design system è a variabili CSS e non
  hardcoded — servono anche da smoke test per il playground/showcase.
- **Playground/GitHub Pages**: aggiunta cornice telefono con notch/statusbar (colori
  legati al tema attivo, non hardcoded), hero di presentazione, strip di swatch tema e
  link al repo, per rendere la demo pubblicata più simile a un vero prodotto e non solo
  a un pannello di controllo.
- **Verifica visiva**: nessun test Playwright automatizzato aggiunto al repo (avrebbe
  richiesto infrastruttura e browser in CI); la parità con il mock è stata verificata
  interattivamente via MCP Playwright (navigazione reale del flow renderizzato, tema
  chiaro/scuro, screenshot confrontati a schermata per schermata col mock HTML).

## v2.x — Multi-framework, step custom, OAuth, mappa reale, CLI (in corso)

- **Registry di step aperto (v2.0/v2.1)**: `stepSchema` (discriminatedUnion chiusa) e lo
  switch di `isStepValid` sono stati sostituiti da un registry runtime
  (`registerStepType`/`getStepTypeDefinition` in core, `registerStepComponent`/
  `getStepComponent` in react). I 12 tipi built-in si auto-registrano via import
  side-effect di `builtins.ts` da `index.ts` — nessun cambiamento per chi importa solo
  `parseFlow`/`FlowRunner` da `@flowkit/core`/`@flowkit/react`.
- **Step["type"] resta un union chiuso via `StepTypeMap` aumentabile**, non un semplice
  `string` come ipotizzato inizialmente nel piano: un `GenericStep` con index signature
  `[key: string]: unknown` inquinava a `unknown` tutte le property access esistenti nelle
  narrowing su `step.type` (es. `review.tsx`, `FlowRunner.tsx`), rompendo il typecheck di
  codice invariato. Soluzione adottata: `StepTypeMap` (interface `type -> Step shape`)
  aumentabile via TS module augmentation:
  ```ts
  declare module "@flowkit/core" {
    interface StepTypeMap { "rating-stars": RatingStarsStep }
  }
  ```
  `Step = StepTypeMap[keyof StepTypeMap]`. Chi non aumenta la mappa può comunque
  registrare/usare uno step custom a runtime (validato dal registry), ma deve castare a
  `Step` lato consumer per il tipo statico. Preserva narrowing e type-safety per tutto il
  codice esistente senza modifiche.
- **`StepTypeDefinition.schema`** tipizzato come `z.ZodType<TStep, z.ZodTypeDef, unknown>`
  (Input generico `unknown` invece di `TStep`): con `z.object({...}).default(...)` sui
  campi, l'Input reale dello schema (pre-default) differisce dall'Output (`TStep`) — usare
  `TStep` anche per l'Input causava errori di assegnabilità nella registrazione dei
  builtin (es. `multi-select`).
- **Step custom, convenzione campi base**: uno step custom registrato via
  `registerStepType`/`registerStepComponent` deve includere gli stessi campi comuni dei
  built-in (`id`, `type`, `title?`, `subtitle?`, `required?`, `icon?`) per restare
  compatibile con codice generico che itera su `Step` a prescindere dal tipo (es.
  `ReviewStepView` in `packages/react/src/steps/review.tsx`, che legge `.icon`/`.title` su
  qualunque step del flow). Documentato con esempio funzionante in
  `apps/playground/src/custom-step-demo.tsx` (step "rating-stars").
- **Bugfix ordine side-effect import in `core/index.ts`**: un `export { x } from "./mod"` è
  a tutti gli effetti un import di `"./mod"` — se scritto PRIMA di un `import "./mod"`
  side-effect-only nello stesso file, il modulo viene comunque valutato alla prima
  occorrenza (l'export), non alla riga dell'import esplicito. Risultato osservato: la
  registrazione estesa di "location" (da `location-step.ts`, con `selectionMode`/
  `initialCenter`/mappa reale) veniva valutata per prima (a causa di `export { locationStepConfigSchema } from "./location-step"` scritto sopra), poi
  `import "./builtins"` la sovrascriveva silenziosamente con lo schema base — nessun
  errore, solo campi mancanti a runtime (bug scoperto testando manualmente con Playwright
  il flow demo, non dal typecheck). Fix: tutti i side-effect import che registrano tipi
  built-in (`./builtins`, poi `./oauth`, poi `./location-step`, in quest'ordine) stanno
  ora in cima a `core/index.ts`, prima di qualunque `export * from`/`export {} from`
  verso quegli stessi moduli.
- **Bugfix `FlowRunner`: `key={step.id}` sullo step component**: senza questa key, due step
  consecutivi dello stesso `type` (es. due step "location" nel flow demo v2.7/v2.8)
  condividevano la stessa istanza React (stesso tipo di componente nella stessa posizione
  dell'albero → nessun remount), quindi stato interno (`useState`, `useEffect` con `[]`)
  e side-effect DOM (mappa maplibre già montata) restavano quelli del primo step invece
  di re-inizializzarsi per il secondo. Scoperto testando manualmente con Playwright il
  flow demo "OAuth + Mappa" (due step "location" consecutivi con `selectionMode` diversa).
  Fix generale, non specifico del solo step mappa.
- **CLI `create-flowkit`/`flowkit-init` (v2.9/v2.10)**: nuovo pacchetto
  `packages/create-flowkit`, due bin nello stesso pacchetto (`create-flowkit` per lo
  scaffold, `flowkit-init` per l'installer in progetto esistente), build con `tsup`
  (target node18, banner shebang). Solo framework "react" implementato in questo giro
  (`selectFramework()` accetta comunque vue/svelte/vanilla ma ricade su react con
  warning, pronta per quando gli altri pacchetti framework esisteranno).
  Prompt interattivi via `@clack/prompts`, ma entrambi i bin rispettano flag
  `--framework <nome>`, `--name <nome>`, `--yes`/`--no-install` per uso non interattivo
  (necessario per testare la CLI in automazione: i prompt di `@clack/prompts` richiedono
  un vero terminale raw-mode, non funzionano pipando stdin).
  Template in `packages/create-flowkit/templates/{init,feedback}/react/`, esclusi da
  `pnpm-workspace.yaml` (altrimenti pnpm li tratterebbe come pacchetti workspace).
  **I pacchetti `@flowkit/*` non sono ancora pubblicati su npm** (tutti `"private": true`):
  la CLI è scritta come se lo fossero (`npm install @flowkit/core` ecc.), pronta per
  quando verranno pubblicati. Verificata con `file:` protocol locale nel frattempo:
  scaffold di `create-flowkit --framework react --no-install`, poi dipendenze riscritte
  a `file:../../packages/<pkg>` e `npm install && npm run build` — build Vite verde,
  prova che il template genera un'app realmente funzionante.
- **Adapter Notion (v2.13)**: chiamate REST dirette a `api.notion.com` via `fetch`
  (coerente con `rest.ts`), niente dipendenza da `@notionhq/client` per restare leggeri.
  Notion non ha un concetto nativo di bozza: `loadDraft`/`saveDraft` operano su una pagina
  con property booleana `draft` filtrata per property `flowId` (rich_text) — non c'è
  storage locale, ogni lettura/scrittura passa dall'API Notion. Il database Notion di
  destinazione deve quindi avere (almeno) le property `flowId` (testo) e `draft`
  (checkbox) oltre a una property per ciascuna risposta che si vuole mappare, oppure un
  `mapAnswersToProperties` custom che le gestisca diversamente.
