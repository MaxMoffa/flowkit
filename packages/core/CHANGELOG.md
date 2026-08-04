# @flowkit-io/core

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
