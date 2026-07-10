# Tasks

## v0.1 — Scaffolding
- [x] Inizializza monorepo pnpm + workspaces + tsconfig base + eslint + vitest
- [x] Crea i pacchetti core, react, themes, adapters, presets e app playground
- [x] Script radice: lint, typecheck, test, build, verify

## v0.2 — Core
- [x] Schema del config del flow con zod (Flow, Step, Field)
- [x] Macchina a stati del flow (next/prev, stato dei field, validazione)
- [x] Test unitari del core (navigazione + validazione)

## v0.3 — React + temi
- [x] Renderer React che monta un flow da config
- [x] Componenti per tutti gli step del registry
- [x] Tema notion-clean come variabili CSS + cornice mobile nel playground

## v0.4 — Adapter e preset
- [x] Adapter local e rest (+ stub supabase)
- [x] Preset odori e preset feedback, entrambi eseguibili nel playground

## v1.0 — Rifinitura
- [x] README con quickstart e demo dei due preset
- [x] Dark mode del tema + selettore tema nel playground

## v1.1 — Parità grafica con mock odori + email + temi extra
- [x] Riscrivi token/CSS tema notion-clean per matchare 1:1 /mnt/c/Users/massi/Downloads/odori-mock.html (cornice telefono, statusbar, header con back+progress+stepno, hero landing, mappa/location, grid card odori, slider intensità colorato, chip durata, faces hedonic, textarea+foto, review list, confirmation check+stat)
- [x] Aggiorna componenti step React per struttura/markup coerente col mock
- [x] Aggiorna preset odori (contenuti/copy/opzioni) per rispecchiare il mock
- [x] Aggiungi opzione flow-level "invia via email" con bottone in confirmation, configurabile dall'utente in fase di setup/config
- [x] Aggiungi almeno 2 temi extra oltre a notion-clean, selezionabili nel playground
- [x] Migliora playground/pagina GitHub Pages (showcase temi + preset)
- [x] Test Playwright: naviga il flow renderizzato e verifica somiglianza visiva/funzionale col mock
- [x] `pnpm verify` verde
