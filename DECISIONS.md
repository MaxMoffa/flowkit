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
