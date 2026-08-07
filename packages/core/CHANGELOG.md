# @flowkit-io/core

## 0.15.0 — 2026-08-07

### Added

- `returnToStep(flow, state, stepId)`: undoes a `goToStep` jump — goes back to `stepId`
  *and* pops the history entry that jump pushed, instead of stacking a second one on
  top. Used by the review step's "torna al riepilogo" after editing an answer reached
  from a clickable review row (a round trip, not two forward moves).

### Fixed

- Editing the answer that drives a branch — via Back, or via a review row — now
  retroactively drops the collected answers for the steps that fell off the newly
  resolved route, instead of leaving them stale in the answers object, the
  review/summary and any PDF/print export.
- Without `returnToStep`, going back to review after editing a review-reached answer
  stacked a duplicate history entry, so the *next* Back silently no-opped (popped
  "review", landed back on "review") — this is what caused the double-submit reported
  on the review step.
- A branch may now target another branch: the chain is followed through in one move to
  the first step that can actually be rendered, instead of only resolving one hop.
- Malformed branch config — a `goTo`/`fallback` naming a step id that doesn't exist, or
  branches that loop back onto each other — now degrades gracefully (falls through to
  the next candidate, ultimately the natural next step) instead of crashing or hanging.
- `resolveFlowPath`'s resolved path (used for `total`/the progress bar) now agrees with
  the actual runtime route in every branch case above, including chained branches.

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
