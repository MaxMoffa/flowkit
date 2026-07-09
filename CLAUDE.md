# Flowkit — istruzioni per l'agente

Libreria open source React per comporre \"flow\" guidati e themeable da un config.
Monorepo pnpm. Target: React 18 + TypeScript. Build: Vite (playground) e tsup (pacchetti).
Validazione config con zod. Test con vitest. Lint con eslint.

## Struttura dei pacchetti
- packages/core       # headless: schema config, macchina a stati del flow, validazione, i18n
- packages/react      # renderer React + componenti degli step
- packages/themes     # temi (default: notion-clean) come design token + variabili CSS
- packages/adapters   # local, rest (+ stub supabase)
- packages/presets    # config pronti: odori, feedback
- apps/playground     # app Vite: seleziona preset e tema, cornice mobile ~390px

## Estetica (tema notion-clean)
Minimalismo caldo (Notion / Apple Health): superfici bianche su canvas tenue, molto
whitespace, un solo accento (#2783DE), angoli morbidi, bordi sottili, iconografia a emoji,
mobile-first con azione primaria full-width in basso. Token: text #2C2C2B, text2 #7D7A75,
canvas #FFFFFF, soft #F9F8F7, surface #F0EFED, border #E6E5E3, accent #2783DE,
success #46A171, warning #D5803B, danger #E56458. Spacing 4/8/12/16/24/32/48/64.
Radius 8/12/20.

## Step da supportare (registry)
intro, location, select-cards, scale, chips, faces, notes-photo, nps, multi-select,
text/number/email, review, confirmation.

## Regole di lavoro
- Lavora un task alla volta, dal primo non spuntato in TASKS.md.
- Commit piccoli e attomici, un commit per task, messaggi in imperativo.
- Dopo ogni modifica esegui `pnpm verify` e correggi finché non passa.
- Non fare domande (headless): prendi decisioni ragionevoli e annotale in DECISIONS.md.
- Non toccare file fuori dal repo. Niente `git push --force`. Niente rimozione dati.
- Se lo stesso errore si ripete 3 volte, scrivi BLOCKED.md con causa e ipotesi, poi fermati.
- Aggiorna TASKS.md spuntando i task completati.

## Definizione di \"fatto\"
Il progetto è completo quando `pnpm verify` passa: vedi scripts/spec-check.mjs e i test.
