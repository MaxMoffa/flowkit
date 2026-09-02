# FlowKit changelog

Repository-level changelog. Per-package changes are in each package's own
`CHANGELOG.md` (`packages/*/CHANGELOG.md`).

## License change — effective FlowKit 1.0.0

**From version `1.0.0`, FlowKit is licensed under the PolyForm Shield License
1.0.0** — see [`LICENSE.md`](./LICENSE.md), [`LICENSING.md`](./LICENSING.md) and
[`COMMERCIAL-LICENSE.md`](./COMMERCIAL-LICENSE.md).

This applies to `@flowkit-io/core`, `@flowkit-io/react`, `@flowkit-io/themes`,
`@flowkit-io/adapters`, `@flowkit-io/presets` and `@flowkit-io/create-flowkit`
at `1.0.0` and later.

What it means:

- **Free for almost everyone.** Personal, internal, educational and research
  use, use of FlowKit as a dependency in your own products (commercial
  included), forks, and plugins/adapters/themes/custom steps are all permitted
  at no cost.
- **Not for competing offerings.** You may not use FlowKit to build a hosted,
  managed, embedded, OEM, self-hosted or white-label product that competes with
  FlowKit or Flowlab, without a commercial license.
- **Permanent, no conversion.** PolyForm Shield 1.0.0 does not expire and does
  not turn into Apache 2.0, MIT, or any other license. The competing-use
  restriction stays in effect indefinitely.

### Previous versions (`0.x`) — unchanged

- **FlowKit `0.x` releases remain under the MIT License, permanently.** The
  license change is **not retroactive**: any right you have in a `0.x` release
  is unaffected, and the MIT grant on those published versions is not revoked.
- **`0.x` is legacy and no longer maintained.** No further releases, fixes or
  security patches will be made on the `0.x` line. Upgrade to `1.x` for
  supported releases.
- The `0.x` npm packages stay published and installable; they will be marked
  **deprecated** on npm with a migration notice pointing to `1.x`.

### Migration

`1.0.0` bundles the license change with new, backward-compatible features (see the
per-package `CHANGELOG.md` files) — no breaking API changes. Upgrading from the latest
`0.x` to `1.0.0`:

```bash
npm install @flowkit-io/core@^1 @flowkit-io/react@^1 @flowkit-io/themes@^1 \
  @flowkit-io/adapters@^1 @flowkit-io/presets@^1
```

Review [`LICENSING.md`](./LICENSING.md) to confirm your use is permitted (for
the large majority of users, it is).
