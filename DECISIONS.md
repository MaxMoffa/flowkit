# Decisioni

Note delle scelte prese in autonomia (lavoro headless, nessuna domanda all'utente).

- **Migrazione pnpm → npm**: monorepo convertito a npm workspaces su richiesta esplicita.
  `pnpm-workspace.yaml` rimosso, `workspaces` dichiarato in `package.json` root
  (`["packages/*", "apps/*"]` — l'esclusione dei template di `create-flowkit` non serve:
  `packages/create-flowkit/templates/**` non è un child diretto di `packages/*`, npm non
  lo tratta come workspace). Dipendenze interne `"workspace:*"` → `"*"`. `allowBuilds.esbuild`
  (gate build-script pnpm-specific) non ha equivalente: npm esegue gli script di build dei
  pacchetti senza approvazione interattiva. Lockfile `pnpm-lock.yaml` sostituito da
  `package-lock.json`. Le voci storiche più sotto restano invariate (documentano lo stato
  al momento in cui furono prese).

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
- **Sfondo pagina/step + override tema per-step (v2.14/v2.15)**: `images.background`/
  `images.stepBackground` erano già nel tipo `ThemeTokens` ma mai consumati; niente nuovo
  campo, solo CSS + risoluzione in `FlowRunner`. `themeOverride` per-step è in
  `baseStepFields` (core) ma tipizzato `z.record(z.string(), z.unknown())`, non
  `Partial<ThemeTokens>`: `packages/core` non dipende da `@flowkit/themes` (solo `zod`),
  mantenerlo così evita di introdurre quella dipendenza solo per un tipo. La mappatura in
  CSS var (`partialTokensToCssVars`) e quindi la validazione "di fatto" dei campi
  accettati vive in `@flowkit/react`. Scoping: wrapper `.fk-step-theme-scope` attorno al
  solo step corrente (dentro `.fk-scroll`), non sul div `.fk-theme` globale — così le
  variabili CSS ridichiarate lì si applicano in cascata solo ai discendenti di quello
  step, senza toccare header/footer.
- **`url(...)` nei valori CSS derivati dal tema**: valori come data-URI SVG contengono
  spazi non quotati; `url(non-quotato con spazi)` è sintatticamente invalido e fa
  fallback silenzioso della proprietà CSS all'initial value (bug reale trovato scrivendo
  i test e2e del tema "showcase": lo sfondo pagina risultava `background-image: none`).
  Fix: `tokensToCssVars`/`partialTokensToCssVars` ora emettono `url("...")` quotato.
- **Step "group" (v2.19)**: le risposte dei figli restano annidate sotto l'id del gruppo
  (`answers[group.id] = { [childId]: value }`), non flat nel top-level `answers`. Scelta
  per evitare qualunque modifica a `canGoNext`/`progress`/`next`/`prev` nella state
  machine di `packages/core`: il gruppo è un normalissimo step "foglia" (nessun `role`
  speciale) il cui `validate` aggrega i validator dei figli. Il tipo `GroupStep` non è
  stato aggiunto a `StepTypeMap`/`Step` in `schema.ts` perché creerebbe una dipendenza
  circolare di tipi (`Step` → `GroupStep` → `Step[]` via `parseStep`); il componente
  React riceve `StepComponentProps` generico e fa il cast interno, stesso compromesso
  già accettato altrove per gli step con `role` custom.
- **Header/footer/progress/animazioni da tema (v2.20/v2.21/v2.22)**: tutti opzionali su
  `ThemeTokens.layout`/`ThemeTokens.animation`, nessun default visibile diverso da oggi.
  Riordino header/footer via CSS `order` (non riordino JSX) per non duplicare la logica
  di rendering; i 4 valori (`header-top`, `header-bottom`, `footer-top`, `footer-bottom`)
  hanno order distinti (1/3, 0/4) per evitare pareggi che farebbero vincere sempre
  l'ordine di scrittura nel JSX (bug reale trovato scrivendo il test e2e: con
  `footerPosition: "top"` e header default, a parità di `order` il footer restava sotto
  perché scritto dopo nel JSX). Barra di progresso: registry component
  (`registerProgressComponent`) identico al pattern già usato per gli step, per
  coerenza mentale con chi già estende flowkit. Animazioni: nessun meccanismo di
  iniezione CSS per i preset custom, il consumer porta le proprie keyframes/classi
  `fk-anim-${name}-*`, coerente con l'approccio "porta il tuo CSS" già usato per i temi.
- **Tema "showcase" (v2.14-2.22)**: aggiunto come 6° tema selezionabile nel playground
  per rendere le nuove feature di tema (altrimenti invisibili senza configurazione)
  raggiungibili e testabili end-to-end con Playwright attraverso la UI reale, invece che
  solo con test unitari. Non pensato per uso in produzione.
- **`enableReverseGeocode` default `true` (v2.18)**: cambia il comportamento visibile di
  default (prima non c'era reverse geocoding, coordinate GPS/click mostrate raw) ma non
  tocca la validazione né il valore salvato (`{lat,lng}`), solo l'etichetta mostrata.
  Fallback silenzioso su qualunque errore di rete/HTTP. Il demo step
  `pick-preset-point` in `features-demo.tsx` lo disabilita esplicitamente perché il suo
  test e2e verifica le coordinate raw esatte, che il reverse geocode sovrascriverebbe.

## v2.23 (from here on, new entries are in English)

- **`notes-photo` removed without a back-compat alias**: split into separate `notes`
  (string value) and `photo` (string|null data-URL value) step types. Package is
  `private`/unpublished (v0.1.0), so no external consumer can depend on the old type.
  odori's preset now composes both via the existing `group` step instead, which also
  doubles as a live demonstration of `group`.
- **`resultActions.resultLink.createLink` / `resultActions.emailApi.sendEmail` are
  injected functions in the step config**, not a new `adapter` prop threaded through
  `FlowRunner`. Mirrors the `mapAnswersToProperties` custom-callback pattern already
  accepted in `notion.ts`, and keeps `@flowkit/react` free of any dependency on
  `@flowkit/adapters`. Consequence: a flow using these two actions must be built as a
  JS/TS object (not loaded from plain JSON), same constraint already implied by every
  existing preset in this repo.
- **`pdfExport` uses `window.print()` + a `@media print` stylesheet**, no new
  dependency (no html2canvas/jsPDF). Matches the project's existing preference for
  zero/light adapter dependencies (see the "niente dipendenza da `@notionhq/client`"
  decision above).
- **`renderReceiptEmailHtml` (packages/react/src/email-templates) is a reference
  template for the consumer's backend**, not called from any client-side code path
  here — the actual email send always happens server-side via `emailApi.sendEmail`.
  Colors are the notion-clean light tokens inlined as literal hex values, since email
  clients don't support CSS custom properties.
- **Map steps split into opt-in entry points**: `@flowkit/react` no longer registers
  `location`/`location-leaflet` by default; a consumer imports
  `@flowkit/react/map-maplibre` and/or `@flowkit/react/map-leaflet` only if they use
  that step. `maplibre-gl`/`leaflet` moved from hard `dependencies` to optional
  `peerDependencies`, so installing `@flowkit/react` no longer forces either map
  library onto projects that don't need maps. This was the concrete fix for the
  "installing only some steps should lighten dependencies" requirement — `flowkit-init
  --steps=` only decides which of these entries get imported/installed for a new
  project, the weight reduction itself comes from the peer-optional split.
- **`date-time` is a single step type with a `mode` field** (`date`/`time`/`datetime`)
  rather than three separate step types, mapped 1:1 to the matching native
  `<input type="...">`. Zero new dependency; "classic options" are min/max/step/
  disablePast/defaultValue on the schema.
- **Restaurant preset uses `date-time` directly** for its date/time step (no more
  text-input placeholder hack), and does not use `group` (unlike odori) — no natural
  fit was found for pairing two steps in a reservation flow, `group` stays
  demonstrated only in odori.
- **`CLAUDE.md`/`DECISIONS.md`/`TASKS.md` untracked from git and added to
  `.gitignore`** at the user's explicit request. They remain on disk as local-only
  files. Trade-off accepted: a fresh clone of this repo will no longer have them, so
  any future agent session bootstrapping from a clean checkout needs these files
  restored manually or from a backup — this is intentional, not an oversight.
