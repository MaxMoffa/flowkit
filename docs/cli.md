# CLI: `create-flowkit` and `flowkit-init`

The `packages/create-flowkit` package exposes two commands (**React** only in this
version; other frameworks are accepted by the prompt but fall back to React with a
warning, pending their renderer packages):

## `create-flowkit` — scaffold a mini-app

Creates a standalone Vite+React project, already wired with `@flowkit-io/presets` (the
`feedback` preset), the default theme and the `local` adapter — no backend required to
get started.

```bash
npx create-flowkit
# or, non-interactive (useful in CI/scripts):
npx create-flowkit --name my-app --framework react --yes
```

Prompts: project name, framework. Then: copies the template, renames `package.json`,
installs dependencies (unless `--no-install`), prints the commands to get started
(`cd my-app && npm run dev`).

## `flowkit-init` — add Flowkit to an existing project

```bash
npx flowkit-init
# or, non-interactive:
npx flowkit-init --framework react --yes
```

Detects the project's package manager (pnpm/yarn/npm from the lockfile present),
installs `@flowkit-io/core` + `@flowkit-io/themes` + `@flowkit-io/adapters` + the chosen
framework package, and writes a `src/flowkit-setup.tsx` file with the minimal wiring
(an empty `FlowRunner` ready to fill in) — not a whole preset.

`flowkit-init` also asks which **optional steps with heavy dependencies** (the two map
variants) you want to include: only the ones you choose get installed (`maplibre-gl`
and/or `leaflet`) and imported (`@flowkit-io/react/map-maplibre`/`map-leaflet`) in the
generated file — a project that doesn't use maps installs neither library.

```bash
npx flowkit-init --framework react --steps=map-maplibre,map-leaflet --yes
# --steps= (empty) or omitting a group excludes it
```

Both commands accept `--no-install` (skips installation, prints the command to run by
hand) and are scriptable end-to-end with `--framework`/`--name`/`--yes`/`--steps`,
because the interactive prompts (`@clack/prompts`) require a real terminal and don't
work when piping stdin.

Back to the [docs index](./README.md).
