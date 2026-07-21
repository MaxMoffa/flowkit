# Installation

Requirements: Node 18+ and npm (used by the monorepo for workspaces).

```bash
npm install
```

If you consume Flowkit from another project (not from this monorepo), install the
packages you need from wherever you've published them:

```bash
npm install @flowkit-io/core @flowkit-io/react @flowkit-io/themes @flowkit-io/adapters
```

> The `@flowkit-io/*` packages are published on the public npm registry — see
> [npmjs.com/package/@flowkit-io/react](https://www.npmjs.com/package/@flowkit-io/react)
> (same for `core`, `themes`, `adapters`, `presets`, `create-flowkit`). Install directly
> with `npm install`/`npx` as shown above, no `file:` protocol or local monorepo needed.

`@flowkit-io/presets` is optional: it only contains ready-made examples, it isn't
required to use the library with your own config.

Back to the [docs index](./README.md).
