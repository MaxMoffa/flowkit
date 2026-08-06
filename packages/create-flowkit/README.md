# @flowkit-io/create-flowkit

CLI scaffolding tool to quickly set up a Flowkit app or add Flowkit to an existing project. Two entry points: `create-flowkit` for standalone apps and `flowkit-init` for integration into existing projects.

## Installation and usage

Install globally or run via `npx`:

```bash
# Create a new Flowkit app
npx @flowkit-io/create-flowkit

# Or add Flowkit to an existing project
npx @flowkit-io/create-flowkit@latest --init

# Or install globally
npm install -g @flowkit-io/create-flowkit
create-flowkit
flowkit-init
```

## Commands

### `create-flowkit`

Scaffold a new standalone Flowkit app from scratch.

**Prompts:**
1. Project name (default: `my-flowkit-app`)
2. Framework selection (currently: React)
3. Install dependencies? (yes/no)

**Output:**
- A new directory with a complete React app structure
- Pre-configured with the `feedbackFlow` preset
- All dependencies listed in `package.json`
- Ready to run with `npm run dev`

**Example:**

```bash
npx @flowkit-io/create-flowkit
# Enter project name: my-feedback-form
# Select framework: React
# Install dependencies? Yes
# Then: cd my-feedback-form && npm run dev
```

### `flowkit-init`

Add Flowkit to an existing project.

**Prompts:**
1. Framework selection (currently: React)
2. Optional step types to include:
   - Map (Maplibre GL)
   - Map (Leaflet)
3. Install dependencies? (yes/no)

**Output:**
- Installs `@flowkit-io/core`, `@flowkit-io/themes`, `@flowkit-io/react`, and adapters
- Optionally installs map libraries (maplibre-gl, leaflet)
- Creates `src/flowkit-setup.tsx` with a demo flow component
- Registers optional step types if selected
- Ready to import and use in your app

**Example:**

```bash
# In your existing React project
npx @flowkit-io/create-flowkit@latest --init
# Select framework: React
# Select optional steps: Map (Leaflet)
# Install dependencies? Yes
# Then: import FlowkitDemo from './src/flowkit-setup.tsx' in your app
```

## Templates

Templates are bundled with the CLI and copied to the new project/setup file. Available templates:

- **feedback** – Standalone demo app with the feedback preset (`odoriFlow` in Italian). React template includes Vite setup, dev server, and build config.
- **init** – Integration template for adding to existing projects. Creates a `flowkit-setup.tsx` file with a minimal demo component and imports for selected optional steps.

## Detected package manager

The CLI auto-detects your project's package manager (npm, yarn, pnpm) based on lockfiles or package manager currently in use. It then:
- Installs dependencies with the correct command (`npm install`, `yarn add`, `pnpm add`, etc.)
- Runs dev/build scripts with the correct prefix (`npm run`, `yarn`, `pnpm`, etc.)

If you prefer a specific package manager, switch before running the CLI or manually edit `package.json`.

## Entry points

The package.json declares two CLI commands:

```json
{
  "bin": {
    "create-flowkit": "./dist/create-flowkit.js",
    "flowkit-init": "./dist/flowkit-init.js"
  }
}
```

- `create-flowkit` → Creates a new app from the feedback template
- `flowkit-init` → Adds Flowkit to existing project from init template

## Development and test commands

From the package directory:

```bash
npm run build          # Build with tsup (ESM + CommonJS entry points)
```

From the repo root:

```bash
npm run lint           # Lint all packages
npm run typecheck      # Type-check all packages
npm run test           # Run all tests (unit + integration)
npm run verify:fast    # lint + typecheck + test + build (no e2e)
npm run verify         # lint + typecheck + test + build + e2e
```

## Compatibility and dependencies

- **Node.js:** 18+ (module: ESM with CommonJS-compatible binaries)
- **Package managers:** npm, yarn, pnpm (auto-detected)
- **Frameworks supported:** React (currently; extensible)
- **Dependencies:**
  - **@clack/prompts** ^1.7.0 – Interactive CLI prompts (similar to create-vite, create-next-app)
- **Peer dependencies:** None
- **Internal workspace dependencies:** None (this package is framework-agnostic and standalone)

## Notes

- The CLI is framework-agnostic internally; the current release includes only React templates. Additional frameworks (Vue, Svelte, Remix, etc.) can be added as new template directories.
- Templates are TypeScript by default (`*.tsx`, `*.ts`); they include tsconfig.json and proper type setup.
- The `create-flowkit` command creates a new directory; `flowkit-init` integrates into the current directory.
- Optional step packages (maplibre-gl, leaflet, @stripe/stripe-js) are only installed if explicitly selected to keep the initial bundle lean.
- The generated `src/flowkit-setup.tsx` file is a demo; modify it or replace with your own flow config and components.
- All generated projects are production-ready; no further configuration is required to run or build.
