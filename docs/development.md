# Monorepo scripts

```bash
npm run lint        # eslint across the whole monorepo
npm run typecheck   # tsc --noEmit (uses package sources via `paths`, not the dist output)
npm run test        # vitest (unit tests: core, themes, adapters, react registry, CLI)
npm run build       # builds every package (tsup) + the playground (vite build)
npm run verify      # lint + typecheck + test + build + scripts/spec-check.mjs
npm run test:e2e    # Playwright, not included in `verify` (slower, requires a browser)
```

`npm run verify` is the project's "definition of done" gate (see `CLAUDE.md`): it must
pass before considering a task complete. `npm run test:e2e` runs separately (also in
CI, in a dedicated workflow) because it involves building+previewing the playground
and launching a browser: slower, not meant for `verify`'s fast cycle.

**Note for anyone developing inside this monorepo**: `apps/playground` imports the
`@flowkit-io/*` packages from their respective `dist/` output (not from sources via HMR).
If you change `packages/react`, `packages/core`, `packages/themes` etc. and want to see
the effect in the playground in dev, you need to rebuild the touched package before
reloading the page:

```bash
npm run build --workspace=@flowkit-io/react --workspace=@flowkit-io/core
```

(`packages/react/src/style.css` is an exception: it's imported by direct path, so CSS
changes are live without a rebuild.)

## End-to-end tests (Playwright)

`e2e/` (at the repo root, not inside a package) contains the Playwright suite, React
target for now:

- `flow-parity.spec.ts` — walks the `odori`/`feedback` presets end-to-end up to
  `confirmation`.
- `theme-visual.spec.ts` — baseline screenshots of the intro screen for each theme
  (`--update-snapshots` to regenerate them after an intentional style change), plus
  the `showcase` theme's background/dots-progress-in-footer/footer-on-top/animation/
  per-step `themeOverride` features.
- `oauth-step.spec.ts` — intercepts the OAuth redirect and checks the authorize URL's
  parameters (`client_id`, `redirect_uri`, PKCE).
- `oauth-anonymous.spec.ts` — custom provider icon and the `allowAnonymous` skip
  button/state.
- `map-step.spec.ts` — real map (maplibre-gl): `point` selection via click,
  `preset-points` via marker, real geocoding search (Nominatim), `showMap`/
  `showSearch`/`enableGps` combinations, GPS button position/style, reverse geocoding
  (mocked, success and error fallback).
- `map-leaflet-step.spec.ts` — `location-leaflet` step: map renders and a click sets a
  value.
- `map-desktop-columns.spec.ts` — desktop (≥1024px) `location`/`location-leaflet`
  two-column layout: both columns match height.
- `map-full-container.spec.ts` — `fullContainer` map step: edge-to-edge rendering,
  floating overlays, short-landscape-phone usability.
- `faces-wrap.spec.ts` — `faces` step wraps onto a new row on very narrow viewports
  instead of shrinking indefinitely.
- `date-time-step.spec.ts` — `date-time` step: `datetime-local` input, `disablePast`
  min, validation gating.
- `group-step.spec.ts` — `group` step: inline rendering of children, aggregated
  validation ("Continue" blocked until every required child has an answer).
- `notes-photo-split.spec.ts` — `notes`/`media` group: both optional and independently
  skippable, plus the `media` step's multi-select/remove/lightbox interactions and its
  two distinct capture/library inputs.
- `file-step.spec.ts` — the generic `file` step: multi-file upload, chips, remove,
  preview.
- `restaurant-preset.spec.ts` — walks the `restaurant` preset end-to-end up to
  `confirmation`.
- `confirmation-result-actions.spec.ts` — the four `resultActions`: `pdfExport` recap
  content (styled `.fk-review-row` markup, not plain text), `nativeShare`
  feature-detection, `resultLink` generation/copy, `emailApi` success/error states.
- `progress-in-footer.spec.ts` — `layout.progressPosition: "footer"` renders the
  progress bar above the footer's nav row instead of in the header.
- `playground-desktop.spec.ts` — desktop layout: CTA stays inside the phone frame,
  footer pinned to the bottom, footer back/continue buttons equal width with a visible
  border on back, progress bar full width in the fullscreen preview.
- `playground-responsive.spec.ts` / `playground-fullscreen.spec.ts` — fullscreen
  preview: desktop centers content in a readable column, small-phone viewports have no
  horizontal overflow, mobile/tablet/desktop width simulation buttons.
- `cli-scaffold.spec.ts` — launches `flowkit-init`/`create-flowkit` in a temporary
  folder, non-interactively (`--framework react --no-install`, plus `--steps=...`
  variants), and inspects the generated files.

```bash
npm run build --workspace=@flowkit-io/create-flowkit   # required before cli-scaffold.spec.ts
npx playwright install chromium                     # one-time
npm run test:e2e
```

Also runs in CI (`.github/workflows/e2e.yml`), separate from the `verify` gate
(`.github/workflows/ci.yml`).

Back to the [docs index](./README.md).
