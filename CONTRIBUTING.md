# Contributing to FlowKit

Thanks for wanting to help. This document covers **licensing of contributions**
and the **development workflow**.

## Licensing of contributions

FlowKit 1.x is distributed under the **PolyForm Shield License 1.0.0**
([`LICENSE.md`](./LICENSE.md)) — a permanent, source-available license with a
competing-use restriction and no conversion clause.

By submitting a contribution (a pull request, patch, or any code, docs or other
material) you agree that:

1. **Inbound = outbound.** Your contribution is licensed to the project and to
   everyone under the **same terms as FlowKit itself** — PolyForm Shield 1.0.0.
2. **Relicensing grant.** You grant Massimo Moffa (the maintainer) a perpetual,
   worldwide, non-exclusive, royalty-free, irrevocable, sublicensable license to
   use, reproduce, modify, distribute and **relicense** your contribution,
   including under the commercial license described in
   [`COMMERCIAL-LICENSE.md`](./COMMERCIAL-LICENSE.md) and under any future license
   the maintainer chooses for FlowKit. This lets the project offer commercial
   licenses — and, if the maintainer ever decides to, move FlowKit to a more
   permissive license — without having to track down every contributor.
3. **You have the right to do this** — the work is yours, or you have permission
   from the rights holder, and it does not knowingly infringe third-party IP.
4. **No warranty / no obligation.** Contributions are provided as-is; the
   maintainer is not obliged to merge anything.

### Developer Certificate of Origin

Every commit must be signed off (`git commit -s`), adding:

```
Signed-off-by: Your Name <you@example.com>
```

This certifies the [Developer Certificate of Origin 1.1](https://developercertificate.org/).

> A formal CLA may be introduced later for larger or corporate contributions.
> If so, it will not change the intent of the terms above.

### Third-party code

Do not paste code from other projects unless its license is compatible and you
say so in the PR (with the source and its license). Vendored third-party files
keep their original license and are out of scope of the FlowKit license.

## Development workflow

Prerequisites: Node 22, npm.

```bash
npm install
npm run dev --workspace=@flowkit-io/playground   # local playground
```

Before opening a PR:

```bash
npm run verify        # lint + typecheck + unit tests + build + spec-check + e2e
# tight loop only (skips Playwright e2e):
npm run verify:fast
```

`npm run verify` must pass. See [`docs/development.md`](./docs/development.md) for
the monorepo layout and scripts.

### Commits and PRs

- Small, atomic commits; imperative mood ("add nps step", not "added").
- One logical change per PR; describe what and why.
- Update docs and `CHANGELOG` entries for user-facing changes.
- New step types: follow [`docs/custom-steps.md`](./docs/custom-steps.md) and
  register in both `@flowkit-io/core` and `@flowkit-io/react`.

## Reporting bugs / security

- Bugs: open a GitHub issue with a minimal repro.
- Security vulnerabilities: **do not** open a public issue — email
  **massimomoffa02@gmail.com** with "FlowKit security" in the subject.
