# @flowkit-io/core

## 1.5.0 — 2026-09-08

### Added

- **`PaymentRequiresActionError`** + **`isPaymentRequiresAction()`** — the deferred
  `payment-stripe` 3DS/SCA hook. Thrown from `onSubmit` (with the PaymentIntent's
  `client_secret`) when the backend's `PaymentIntent.confirm` came back
  `requires_action`; `@flowkit-io/react`'s `FlowRunner` catches it, runs the browser
  challenge, and re-invokes `onSubmit` once. `isPaymentRequiresAction` also matches a
  plain `{ code: "requires_action", clientSecret }` look-alike (cross-bundle).
- `PendingPayment` now carries `publishableKey` and `stripeAccount` (when set) — what
  `FlowRunner` needs to run the challenge.
- New i18n key `payment3dsFailed` (it + en).

## 1.4.0 — 2026-09-07

### Added

- **`ctaFootnote`** (`ContentText`, optional) on the `intro` **and** `review` steps —
  small print rendered under the primary button, with the library's restricted markdown
  (bold/italic/link/list). Separate fields (opening disclaimer vs. pre-submit one), for
  a platform (e.g. FlowLab) to attach a standing disclaimer to flows its users author.
  Purely presentational — no field, no validation.
- **`flow.errorScreen`** — opt-in generic error screen shown by `FlowRunner` outside the
  step flow when a `review` submit rejects (or on an imperative `showError()`). Config
  `{ image?, title?, message?, actions? }`; `errorActionSchema` (`retry` / `goToStep` /
  `back` / `restart` / `home` / `dismiss`). `resolveErrorScreen(flow, payload)` merges
  payload → config → i18n defaults and picks default actions (retry + "change payment
  method" when the flow has a payment step). Default badge is an inline SVG warning
  triangle (inherits `currentColor`, centres exactly — like the confirmation checkmark),
  overridable via `errorScreen.image`. New i18n keys `errorTitle` /
  `errorGenericMessage` / `errorRetry` / `errorChangePayment` / `errorEditStep` /
  `errorRestart` (it + en).

### Changed

- `report.ts`: the `payment-stripe` review row value no longer carries a leading `💳`
  emoji (`Visa •••• 4242`, `PayPal`, …). The row already renders the `💳` type icon in
  its own column, so the prefix was a duplicate.

## 1.3.0 — 2026-09-06

### Added

- **`product` step** — hero showcase for 1-4 items, sharing `catalog`'s item shape
  (`catalogItemSchema` reused verbatim: value/label/description/details/price/image/
  maxQuantity/taxCode) and order-summary logic (`buildOrderSummary`/`catalogTotal`
  treat `product` identically to `catalog`), capped at 4 items. `productStepSchema`,
  `asProductValue`, `productTotal`.
- **Opt-in content-translation dictionary.** `ContentText` — a step/option field
  (title, subtitle, label, description, catalog/product item text…) can now be either
  a literal string (unchanged default) or `{ key, fallback? }`, resolved against the
  flow's own `flow.content` dictionary via `resolveContentText(flow, value)`. Separate
  namespace from `flow.texts` (the library's fixed chrome/system strings). Fully
  opt-in — every existing literal-string flow keeps working unchanged.
- `catalog`/`product` items gain `tags?: string[]`. `catalog` step gains
  `filters?: CatalogFilter[]` (`{ label: ContentText, icon?: StepImage, tag: string }`)
  — a filter 1:1 with a tag; rendering/filtering behavior lives in `@flowkit-io/react`.
- `payment-stripe` gains `previewSelected: boolean` (default `false`) — when `true`,
  never loads Stripe Elements; the step immediately shows a fake "method selected"
  summary and synthesizes a `PaymentStripeValue` via the renderer, for previewing the
  step's full UI without a working publishable key. Same pattern as `verification`'s
  `previewVerified`.
- **`photo` step** — dedicated camera-capture step (schema only; the live-preview
  camera UI lives in `@flowkit-io/react`). `maxPhotos` (default 1), answer value is
  `UploadedItem[]`, same shape `media`/`file` already use.
- **`barcode-scan` step** — live camera scan of a barcode/QR code. `formats?:
  BarcodeFormat[]` (Barcode Detection API symbology names, default
  `DEFAULT_BARCODE_FORMATS`), `allowManualEntry` (default `true`). Answer value
  `{ code, format? }`. `barcodeFormatSchema`, `resolveBarcodeFormats`,
  `asBarcodeScanValue`.
- **`flow.schemaVersion` + migration framework** (`flow-versioning.ts`) — versions the
  flow *config's own shape*, separate from this package's npm semver.
  `CURRENT_FLOW_SCHEMA_VERSION` (starts at `1`), `FLOW_MIGRATIONS` (keyed by the
  version each migrates from), `migrateFlowInput`, `getRawFlowSchemaVersion`.
  `parseFlow` migrates a saved flow up to the current version before validating it, so
  a future breaking change to the flow shape doesn't break already-saved flows outright
  — and throws a clear "upgrade @flowkit-io/core" error for a flow saved with a newer
  schema version than the running build supports. `Flow.schemaVersion` is always
  present (defaulted) on a value returned by `parseFlow`.
- i18n: `submitWithPaymentAmount` ("Paga {amount} ✓" / "Pay {amount} ✓"),
  `taxInclusiveNote` / `taxExclusiveNote` ("IVA inclusa"/"+ IVA" / "Tax included"/
  "+ tax"), `catalogFilters`, `catalogFilterEmpty`, `cartOpen`, plus the `photo`/
  `barcode-scan` chrome strings (capture/retake, permission/status/error text, manual
  entry label).

### Fixed

- **`review` step's submit button never actually became "pay & submit".**
  `submitLabel` carried a zod `.default("Invia segnalazione ✓")`, so it was never
  `undefined` once parsed — the payment-aware fallback in `@flowkit-io/react`'s
  `FlowRunner` (`flowHasPayment(flow) ? "submitWithPayment" : "submit"`) was
  unreachable dead code despite `paymentSummary`'s own doc comment describing exactly
  that behavior. `submitLabel` is now `.optional()`; an explicit config value still
  always wins. Combined with `submitWithPaymentAmount` above, the button now names the
  actual amount due when one is resolvable.
- `barcode-scan`'s `required` field was accepted by the schema but silently ignored by
  its own validation (`barcodeScanIssue` always required a value) — it happened to work
  anyway via a generic `step.required === false` bypass elsewhere in the validation
  pipeline, but is now checked explicitly, matching `catalog`/`product`/`address`.

## 1.2.0 — 2026-09-04

### Added

- **`catalog` step.** The visitor builds an order: pick items from a priced list and
  choose a quantity for each. Config carries `items` (`{ value, label, description?,
  details?, price, image?, maxQuantity? }`), `currency`, `minItems`/`maxItems`,
  `maxPerItem`. `details` is a longer markdown blurb the renderer shows in a
  drawer/dialog on tap. Answer value is `{ items: [{ value, quantity }], total }`.
- `buildOrderSummary(flow, answers)` — itemized order recap for the review step: one
  `"item"` line per picked catalog item (with quantity + unit price), one `"fee"` line
  per priced option and for the payment step's flat `amount` surcharge, plus the total.
  Returns `null` when nothing is priced.
- `computeOrderTotal(flow, answers)` — total (minor units) of every priced selection in
  the flow (catalog items + priced options); now a thin wrapper over `buildOrderSummary`
  that excludes the payment step's own surcharge (added separately by
  `resolvePaymentAmount`).
- `catalogTotal(step, value)`, `asCatalogValue(value)`.
- **`address` step** — country + postal code + line1/line2/city/state. `countries?`
  renders a `<select>`; otherwise a free 2-letter country input. Answer value
  `{ country, postalCode?, state?, city?, line1?, line2? }`.
- **Tax seam.** `payment-stripe` gains `taxBehavior` (`"inclusive"`/`"exclusive"`,
  default exclusive) and an optional platform-injected `calculateTax` function (never
  serialized). `catalogItemSchema` gains `taxCode` (Stripe `txcd_…`). `buildTaxInput`
  (`tax.ts`) collects the order lines + the `address` step's answer into the shape
  `calculateTax` expects, or `null` when the order/address isn't ready. Types
  `CalculateTax`, `TaxCalculation`, `TaxCalculationInput`, `TaxLineInput`,
  `TaxBreakdownEntry`.
- **Estimated tax before an address is collected.** `buildTaxInput` gains a 4th
  optional `estimatedAddress` param: when the flow's own `address` step hasn't been
  answered yet, it falls back to this (typically the host page's server-side IP-based
  country lookup) instead of returning `null`. `TaxCalculationInput` gains
  `addressSource: "collected" | "estimated"` so a consumer/UI knows whether the address
  is the visitor's own or a guess. New i18n keys `taxEstimated`, `catalogEstimatedTotal`.
- `resolvePaymentAmount(step, flow, answers)` — the amount a `payment-stripe` step will
  charge, for `"fixed"` and `"cart"` sources alike. Used by `getPendingPayment`.

### Changed

- `optionSchema` gains an optional `price` (minor units) — lets a plain option-list step
  act as a priced picker.
- **`payment-stripe` step: `amount` is now optional.** New `amountSource` field
  (`"fixed"` | `"cart"`, default `"fixed"`). `"cart"` charges `computeOrderTotal` plus
  `amount` as a flat surcharge; `"fixed"` still requires a positive `amount`.
  `getPendingPayment().amount` is now the resolved (possibly cart-derived) total.

## 1.1.0 — 2026-09-03

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
