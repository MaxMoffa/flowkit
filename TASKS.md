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

## v2.0 — Core: registry dei tipi di step
- [x] `core/registry.ts`: `StepTypeDefinition`, `registerStepType`, `getStepTypeDefinition`, `listRegisteredStepTypes`
- [x] `core/schema.ts`: schema aperto + validazione dinamica di `config` via registry
- [x] `core/machine.ts`: `isStepValid` via registry lookup
- [x] `core/builtins.ts`: registrazione dei 12 step con validazione portata dal vecchio switch
- [x] `core/index.ts`: import side-effect di `builtins.ts` + export API registry
- [x] Aggiornare test `packages/core` (stesse asserzioni pubbliche, nuovo meccanismo sotto)
- [x] `scripts/spec-check.mjs`: da lista hardcoded 12 nomi a lettura di `listRegisteredStepTypes()`

## v2.1 — React: registry dei componenti di step
- [x] `react/registry.tsx`: `Map` + `registerStepComponent`/`getStepComponent`
- [x] `react/steps/builtins.ts`: registrazione dei 12 componenti
- [x] `react/index.ts`: import side-effect + export pubblico
- [x] `FlowRunner.tsx`: uso di `getStepComponent`, verifica special-case intro/confirmation/review via test esistenti
- [x] Test con un tipo di step custom registrato a runtime

## v2.2 — API pubblica per step custom + doc
- [x] Export registry API da `core/index.ts` e `react/index.ts`
- [x] Esempio funzionante in `apps/playground` (preset di test con step custom, verificato con Playwright)
- [x] Bozza README "Step personalizzati" (contenuto pieno in v2.12)

## v2.3 — Temi: token font e immagine
- [x] Estendere `ThemeTokens` con `fonts?`/`images?`
- [x] Estendere `themeToCssVars`/`themeToCssString`
- [x] Helper `injectThemeFontLinks`
- [x] Test `packages/themes` per il nuovo mapping

## v2.4/v2.5/v2.6 — `packages/vue`/`packages/svelte`/`packages/vanilla`
- [ ] **Rimandato**: l'utente ha chiesto di implementare oauth/mappa/CLI/e2e solo per React in
      questo giro; Vue/Svelte/vanilla restano pianificati (vedi piano `/home/maxmoffa/.claude/plans/prepara-un-piano-per-majestic-kite.md`) per un giro successivo.

## v2.7 — Step OAuth (solo React in questo giro)
- [x] `core/oauth-providers.ts` (preset google/github/facebook + generic)
- [x] `core/pkce.ts` (`generatePkcePair`, `buildAuthorizeUrl`)
- [x] Registrazione step type `oauth` con `validate`
- [x] `core/oauth.ts`: `completeOAuthCallback`
- [x] Step "oauth" in react
- [ ] Step "oauth" in vue/svelte/vanilla — rimandato (vedi v2.4/v2.5/v2.6)
- [x] Esempio in `apps/playground` con provider `generic` demo
- [ ] README "Step OAuth" (in v2.12)

## v2.8 — Step Mappa reale con maplibre-gl (solo React in questo giro)
- [x] `core/geocoding.ts`: `geocode(query, config)`
- [x] `LocationStepConfig`/`SelectionMode` + validazione
- [x] Aggiornamento registrazione step type `location` nel registry
- [x] Riscrittura reale in `packages/react/src/steps/location.tsx` (maplibre-gl + search)
- [ ] Stessa riscrittura in vue/svelte/vanilla — rimandato (vedi v2.4/v2.5/v2.6)
- [x] CSS wrapper mappa coerente coi token tema
- [x] Aggiornare `odori.ts` se necessario (retro-compatibile)
- [ ] README "Step mappa" (in v2.12)

## v2.9 — CLI: installer in progetto esistente (`flowkit-init`, solo target React per ora)
- [x] Scaffolding pacchetto `packages/create-flowkit`
- [x] `src/detect-package-manager.ts`
- [x] `src/prompts.ts` (framework: solo "react" selezionabile per ora, flag `--framework`/`--yes`/`--no-install` per uso non interattivo)
- [x] `src/bin/flowkit-init.ts`
- [x] Template wiring `templates/init/react/`
- [x] Test: lancio bin in tmp dir (`--framework react --no-install`), ispezione file risultanti

## v2.10 — CLI: scaffold da preset "feedback" (`create-flowkit`, solo React per ora)
- [x] Esclusione template da `pnpm-workspace.yaml`
- [x] Template `templates/feedback/react/*`
- [x] `src/bin/create-flowkit.ts`: prompt + copy + placeholder + install
- [x] `src/copy-template.ts`
- [x] Verifica manuale: scaffold + `file:` link ai pacchetti locali + `npm install && npm run build` verde

## v2.11 — Test Playwright (solo React per ora)
- [x] `playwright.config.ts` root + webServer su build/preview del playground
- [x] `e2e/flow-parity.spec.ts` (odori + feedback, flow completo end-to-end)
- [x] `e2e/theme-visual.spec.ts` (screenshot baseline per i 3 temi)
- [x] `e2e/oauth-step.spec.ts` (intercetta redirect, verifica query param/PKCE)
- [x] `e2e/map-step.spec.ts` (point/preset-points/geocoding reale)
- [x] `e2e/cli-scaffold.spec.ts` (flowkit-init + create-flowkit non interattivi)
- [x] `test:e2e` in root `package.json`, non incluso nel gate `pnpm verify` (separato, come da piano)
- [x] Workflow CI `.github/workflows/e2e.yml` + `ci.yml` (gate verify, mancante finora)
- [ ] Mock dedicati per oauth/nominatim (`e2e/fixtures/*`) — non necessari nella pratica: intercettazione route inline nei test è bastata; nominatim usato realmente (endpoint pubblico, stabile per demo). Rivalutare se servono in CI meno affidabile in rete.

## v2.13 — Adapter Notion
- [x] `adapters/src/notion.ts`: `createNotionAdapter`, mapping default risposte→property
- [x] Test `packages/adapters` per `notion.ts` (mock `fetch`)
- [x] README: sezione adapter con riga Notion
- [x] DECISIONS.md: nota REST diretto vs SDK, gestione draft

## v2.12 — Documentazione finale, README, TASKS/DECISIONS, spec-check
- [x] Banner ASCII art in README
- [x] Ristrutturazione README (indice esteso: CLI, step personalizzati, oauth, mappa, e2e; nota multi-framework "solo React per ora")
- [x] `DECISIONS.md`: log decisioni pendenti (registry/StepTypeMap, ordine side-effect import, key={step.id}, CLI, Notion, e2e)
- [x] `scripts/spec-check.mjs`: generalizzazione (già in v2.0, verificata coerente coi nuovi tipi oauth/location estesa)
- [x] `pnpm verify` verde su tutto il monorepo esteso

## v2.14 — Sfondo pagina/step da tema
- [x] `packages/themes`: `partialTokensToCssVars`, tabella condivisa token→var
- [x] `FlowRunner.tsx`: risolve `images.stepBackground[id|type]` → `--fk-image-step-background`
- [x] CSS `.fk-root`: background cover/center dietro le card, nessuno scrim di default
- [x] Test e2e (`theme-visual.spec.ts`, tema "showcase")

## v2.15 — Override tema per singolo step
- [x] `core/schema.ts`: campo `themeOverride` opzionale in `baseStepFields`
- [x] `FlowRunner.tsx`: wrapper `.fk-step-theme-scope` con CSS var mergiate, scope solo sullo step corrente
- [x] Test e2e (accento diverso solo sullo step con override)

## v2.16 — Location: GPS sotto la mappa, stile neutro
- [x] CSS `.fk-btn-neutral`, rimossa classe `.fk-link` dal bottone GPS
- [x] `location.tsx`: bottone spostato sotto `.fk-map-canvas`
- [x] Test e2e (posizione DOM + classe)

## v2.17 — Location: toggle indipendenti mappa/ricerca/gps
- [x] `core/location-step.ts`: campo `showSearch` (default true)
- [x] `location.tsx`: render condizionale dei 3 blocchi, skip init maplibre se `showMap=false`
- [x] Demo step per ogni combinazione in `features-demo.tsx`
- [x] Test e2e (search-only, map-only, gps-only)

## v2.18 — Location: reverse geocoding reale
- [x] `core/geocoding.ts`: `reverseGeocode()` (Nominatim `/reverse`, mai throw)
- [x] `core/location-step.ts`: `enableReverseGeocode` (default true), `reverseGeocodingEndpoint`
- [x] `location.tsx`: effect debounced (500ms) su lat/lng, guard su ricerca forward appena eseguita
- [x] `enableReverseGeocode: false` sullo step demo `pick-preset-point` (preserva il test coordinate raw)
- [x] Test e2e (successo mockato + fallback su errore)
- [x] Nota in DECISIONS.md: default `true` cambia l'etichetta visibile, non la validazione

## v2.19 — Step "group": comporre più step in un'unica pagina
- [x] `core/group-step.ts`: schema + parse ricorsivo dei figli + `validate` aggregato
- [x] `react/steps/group.tsx`: rendering inline dei figli, valore aggregato `{ [childId]: value }`
- [x] CSS layout `stack`/`columns`
- [x] Demo step in `features-demo.tsx`, test e2e (validazione aggregata)

## v2.20 — Header/footer: posizione configurabile da tema
- [x] `themes`: `ThemeLayoutTokens.headerPosition/footerPosition`
- [x] `FlowRunner.tsx`: CSS `order` su header/body/footer (nessun riordino JSX)
- [x] Test e2e (tema "showcase", footer sopra l'header)

## v2.21 — Barra di progresso: varianti bar/dots/hidden/custom
- [x] `react/progress-registry.ts`: registry component (stesso pattern degli step)
- [x] `BarProgress`/`DotsProgress` built-in, `theme.layout.progressVariant` seleziona
- [x] CSS `.fk-progress-dots`
- [x] Test e2e (variante dots visibile, barra assente)

## v2.22 — Animazioni di transizione tra step da tema
- [x] `themes`: `ThemeAnimationTokens.name/duration`
- [x] `FlowRunner.tsx`: tracking direzione next/prev, classi `fk-anim-${name}-dir-${direction}` sul wrapper remounted
- [x] CSS keyframes `fade`/`slide`, nessun cambiamento se `animation` assente/`"none"`
- [x] Tema "showcase" per dimostrare tutte le feature v2.14-2.22 insieme
- [x] Test e2e (classe applicata al cambio step)
