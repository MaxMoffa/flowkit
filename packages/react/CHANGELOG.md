# @flowkit-io/react

## 0.16.1 — 2026-08-04

### Fixed

- `@flowkit-io/react/steps/branch`, `/steps/info` and `/steps/long-content` are now
  actually built — the tsup config advertised them via the package's `exports` map but
  never included them in the build, so importing any of the three threw a module-not-
  found error.
- Removed a stale `eslint-disable` comment in the verification step (was suppressing
  nothing).

### Changed

- `FlowRunner`'s internal handlers (`handleChange`, `handleNext`, `handlePrev`, etc.)
  are now wrapped in `useCallback` instead of being recreated every render — no
  observable behavior change today (no step component is memoized yet), but removes a
  prerequisite blocker for doing so in the future.

## 0.16.0 — 2026-08-04

### Added

- `FlowRunner`: new optional `initialStep`/`initialAnswers` props to resume a flow
  after a page refresh — mounts directly on a given step, with answers preloaded.
  Falls back silently to the normal initial step when the target is missing or
  unreachable; never throws. Fully backward compatible (both optional, no effect when
  unset).
- `FlowRunnerHandle` (the imperative `ref`): extended with `goToStep`, `getAnswers`,
  `setAnswers`, and `reset`, so an integration can drive the flow from outside —
  alongside the existing `currentStep`.

### Fixed

- A step's `image` (emoji/icon/image) now renders for every step type, not just
  `intro`/`info` — previously it was silently dropped by every other step component.
  Renders inline next to the title (new `.fk-title-icon` size), distinct from
  intro/info's larger hero badge treatment.
