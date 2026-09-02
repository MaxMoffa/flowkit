# @flowkit-io/core

## Unreleased

### Changed

- **`payment-stripe` step: deferred model (breaking).** The step now only *collects* a
  payment method — it mints a single-use Stripe ConfirmationToken client-side and the
  charge is deferred to the flow's final submit. Removed `createPaymentIntent` and
  `buttonLabel` from the step config; added `changeLabel` (default `"Cambia"`). Answer
  value is now `{ status: "collected", confirmationTokenId, summary }`.
- `review` step: new `paymentSummary` field (`"auto"` | `"hidden"`, default `"auto"`).
  When the flow has a `payment-stripe` step, a `"final"` review shows the amount as a
  total callout and its submit button label becomes `submitWithPayment`.

### Added

- `getPendingPayment(flow, answers)` — returns the collected ConfirmationToken plus the
  payment step's `amount`/`currency`, for confirming the charge in `onSubmit`. Returns
  `null` when there's no payment step or no method was picked.
- `flowHasPayment(flow)` — whether the flow contains a `payment-stripe` step.
- `formatMoney(minorUnitAmount, currency, locale?)` — localized currency formatting that
  respects each currency's fraction digits.
- New i18n keys: `submitWithPayment`, `paymentTotal`, `paymentFailed` (it/en).
- `report.ts`: `payment-stripe` answers render as a method row (`💳 Visa •••• 4242`,
  `💳 PayPal`, …).

## 1.0.0 — 2026-09-01

### Added

- `radio` / `multi-select` steps: opt-in `otherOption` (`{ label?, placeholder? }`). When
  present, the step shows an "Altro" choice with a free-text input; what the user types
  becomes the answer value (a string not matching any option). New i18n keys `otherOption`
  ("Altro" / "Other") and `otherOptionPlaceholder`.
- `confirmation` step: `showRestartButton` (boolean, default `true`) hides the secondary
  restart ("nuova segnalazione") button. Its label was already configurable via
  `secondaryCta`. With both `showRestartButton` and `showHomeButton` `false`, the
  confirmation step renders no footer.

### Changed

- Review recap: a `file` step answer now lists the uploaded file **names** (`📎 a.pdf,
  b.pdf`) instead of a bare count — a `media` step stays a count.
- **License:** relicensed from MIT to the **PolyForm Shield License 1.0.0**, effective
  this version — permanent, source-available, no competing use with FlowKit or Flowlab,
  no conversion to an open-source license. See the root `CHANGELOG.md`, `LICENSE.md` and
  `LICENSING.md`.
- `@flowkit-io/core` `0.x` releases remain under the MIT License and are now
  legacy / unmaintained.

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
