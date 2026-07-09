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
- **Review step**: mostra i valori grezzi delle risposte (es. value invece di label
  tradotta) — sufficiente per il preset demo, migliorabile in futuro con una mappa
  value→label per opzioni.
