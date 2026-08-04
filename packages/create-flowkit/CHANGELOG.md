# @flowkit-io/create-flowkit

## 0.2.3 — 2026-08-04

### Fixed

- Scaffold template (`templates/feedback/react`) pinned `@flowkit-io/core@^0.6.0` and
  `@flowkit-io/react@^0.7.0` (current: 0.13.x/0.16.x), plus React 18/Vite 6/TypeScript
  5.7 while the rest of the monorepo had moved to React 19/Vite 8/TypeScript 5.9.
  Newly scaffolded projects were installing majors-behind minors. All pins bumped to
  match current versions.
