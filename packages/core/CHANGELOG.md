# @flowkit-io/core

## 0.13.1 — 2026-08-04

### Changed

- Internal refactor: `machine.ts` (547 lines, six distinct concerns) split into
  `flow-state.ts`, `flow-validation.ts`, `flow-navigation.ts`, `flow-path.ts` and
  `flow-initial-state.ts`. `machine.ts` is now a thin re-export barrel — every name it
  used to export is still exported from the same place, and from the package's public
  entry point. No behavior or bundle-size change.
- Added unit tests for `pkce.ts` and `geocoding.ts` (previously untested).

## 0.13.0 — 2026-08-04

### Added

- `computeInitialFlowState(flow, options?)`: builds the `FlowState` a `FlowRunner`
  should start from, honoring `initialStepId`/`initialAnswers` — used to resume a flow
  after a page refresh instead of always starting blank at the first step.
- `isStepReachable(flow, state, stepId)`: whether a step is reachable given the current
  answers (on `resolveFlowPath`'s resolved path, or the intro/confirmation edge cases).
- `filterValidAnswers(flow, rawAnswers)`: keeps only the answers that belong to a real
  step and pass that step's own validation rule, dropping unknown keys and invalid
  values silently.
