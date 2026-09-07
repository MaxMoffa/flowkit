# @flowkit-io/react

## 1.6.0 — 2026-09-08

### Added

- **`registerStripeNextActionRunner` / `getStripeNextActionRunner`** and the
  `StripeNextActionRunner` / `StripeNextActionRequest` / `StripeNextActionResult`
  types are now exported from the main and `/lean` entries (added internal-only in
  1.5.0). The `@flowkit-io/react/payment-stripe` entry still registers the real
  Stripe.js runner on import; a host can now register its own *after* that import to
  swap the 3DS executor — a custom Stripe.js loader, or a mock for a demo / QA build
  (the playground's 3DS demo does exactly this).

## 1.5.0 — 2026-09-08

### Added

- **Deferred payment 3DS/SCA**. When `onSubmit` rejects with
  `PaymentRequiresActionError` (`@flowkit-io/core`), `FlowRunner` runs the Stripe
  next-action challenge in the browser and re-invokes `onSubmit` once so the backend
  can re-confirm + persist the authenticated PaymentIntent. A second `requires_action`
  from the retry surfaces as a normal error (no loop); the challenge also runs from
  the `flow.errorScreen` **Riprova** action. The challenge executor
  (`stripe.handleNextAction`) is registered by the `@flowkit-io/react/payment-stripe`
  entry — the only module that loads Stripe.js; `FlowRunner` itself stays Stripe-free
  and no-ops (generic error + `console.error`) if that entry isn't imported.
  `registerStripeNextActionRunner` / `getStripeNextActionRunner` and the
  `StripeNextActionRunner` / `StripeNextActionRequest` / `StripeNextActionResult`
  types.

## 1.4.0 — 2026-09-07

### Added

- **`ctaFootnote`** (`@flowkit-io/core`, on `intro` and `review` steps) renders as
  `.fk-footer-note` — small print under the primary button, via `FlowMarkdown` so a
  link is clickable.
- **Generic error screen** (`flow.errorScreen`, `@flowkit-io/core`). When the flow
  declares it, a rejected `review` `onSubmit` shows a full recovery screen
  (`ErrorScreenView` — badge, title, message, stacked action buttons) instead of the
  one-line footer message; without it, the footer-message behavior is unchanged.
  `FlowRunnerHandle.showError(payload)` and `StepComponentProps.onError(payload)` raise
  it from anywhere; a `retry` action re-runs `payload.onRetry` (or re-submits). New
  `ShowErrorPayload` type. `.fk-step-error` / `.fk-error-badge` / `.fk-error-actions`
  CSS. The screen carries over the theme's `fade` step animation (with its duration);
  `slide` / no animation leave it appearing instantly. Focus moves to the first
  recovery button on show. Badge / title / message sizes and spacing match the
  confirmation step (88px badge, 40px default SVG icon, `.fk-title` 26px).

## 1.3.0 — 2026-09-06

### Added

- **`product` step component** — hero card(s) for 1-4 items; a single item gets a
  bigger `-solo` treatment. Opt-in entry `@flowkit-io/react/steps/product`.
- **`photo` step component** — live camera viewfinder (`getUserMedia` + `<video>`,
  new shared `steps/shared/use-camera-stream.ts` hook), a capture button snapshots the
  current frame to the same `UploadedItem[]` pipeline `media`/`file` already use.
  Falls back to the previous `<input capture>` mechanism when the camera is denied/
  unavailable/unsupported. Reuses `MediaViewer` for the shot-so-far grid.
- **`barcode-scan` step component** — live decode via the native `BarcodeDetector` API
  first, a dynamically-loaded ZXing fallback (`@zxing/library@0.21.3` UMD, jsDelivr,
  loaded only when this step mounts and the native API is unavailable) otherwise.
  Manual code entry is always available as a robustness/accessibility net — typing a
  code writes the answer directly (no separate confirm button), so the flow's own
  "Continua" is the only way to proceed either way. A camera-found result and a
  manually-typed one are told apart by `format` (camera-only).
- **`FlowRunnerProps.locale` / `FlowRunnerProps.content`** — override `flow.locale` /
  `flow.content` for a render without mutating the stored flow config (same spirit as
  the existing `estimatedAddress`), for a platform that serves one flow definition in
  several languages.
- **Footer cart panel is now editable.** Its +/- stepper and remove control write back
  to whichever `catalog`/`product` step actually owns the clicked line (not always the
  step currently on screen — the panel can aggregate rows from several such steps).
- **Real product images**, not just a small icon badge: `StepImage` gains
  `"product-thumb"` (catalog row, ~60px) and `"product-hero"` (product card, a
  full-width banner, larger still on a solo card) sizes.
- **Tax visibility note** ("+ IVA" / "IVA inclusa") next to prices in `catalog`,
  `product`, the footer's running total, and the cart panel — shown only when the
  flow's `payment-stripe` step has `calculateTax` configured.
- **`catalog` step: facet filters.** A row of chip buttons (icon + label, from the new
  `filters` config) above the item list; toggling one or more filters shows items
  whose `tags` include ANY selected filter's tag (OR), an empty match shows a
  dedicated empty-state message. Local UI state only — never part of the saved answer.
- Layout now responds to the width of the box FlowKit is actually mounted in
  (`@container` queries anchored on the flow's own root element), not the browser
  window's viewport — a component embedded in a narrow container inside a wide
  browser window now correctly stays in its mobile layout instead of switching to
  desktop styling it has no room for. The footer's cart/dialog panel is the one
  deliberate exception (a true page-level overlay, keyed to the real viewport instead,
  like `FlowOverlay`'s own drawer/dialog switch).
- Desktop (≥1024px container): `product` cards lay out in a 2-column grid; the
  footer's running total moves beside the primary buttons instead of stacking above
  them, with a new 🛒 cart trigger (badge = item count) that opens the cart panel as a
  bottom drawer on mobile / centered dialog on desktop; once a cart/total is present,
  the footer now spans its real available width (cart+total at the left edge,
  Indietro/Continua at the right) instead of both being squeezed into the same
  ~640px centered reading column the step content itself uses.

### Fixed

- The footer's running-total line spread its label/amount/tax-note evenly across the
  row (`justify-content: space-between` over three items put the amount in the middle
  instead of next to the tax note) — amount and tax note now sit grouped together at
  the right, label at the left.
- The cart panel's own trash-can icon rendered smaller/paler than the +/- stepper
  buttons beside it despite an identical control size (emoji glyphs carry a lot of
  built-in internal whitespace) — sized up to match.

## 1.2.0 — 2026-09-04

### Added

- **`catalog` step component** — product cards with an image, price and a per-item
  quantity stepper, plus a running order total. Registered as a built-in and available
  as the opt-in entry `@flowkit-io/react/steps/catalog`. An item with a `details` blurb
  is tap-to-expand: a bottom drawer on mobile, a centered dialog from 768px up
  (close via ✕, backdrop, Escape).
- **`address` step component** — a small form (country / address / postal code / city /
  state). Built-in; opt-in entry `@flowkit-io/react/steps/address`.
- **`FlowRunnerProps.estimatedAddress`** (also on `FlowOverlayProps`) — the host page's
  best-guess visitor address (typically `{ country }` from a server-side IP lookup),
  threaded down to every step as `StepComponentProps.estimatedAddress`. The `catalog`
  step uses it: once the cart isn't empty, it calls the payment step's `calculateTax`
  itself (new shared `steps/shared/use-tax-calculation.ts` hook, also now used by
  `review`) with this as a fallback address while the flow's own `address` step hasn't
  been answered yet, and shows the result as a small note labeled "· stima" /
  "· estimate" (`.fk-catalog-tax-note`). `review`'s own tax line gains the same caveat
  (`.fk-order-summary-tax-note`) for the same reason — mid-flow checkpoint reviews can
  sit before `address` too. Purely additive; a flow with no `calculateTax` wired, or no
  `estimatedAddress` passed, renders exactly as before.
- **Running order total in the footer.** When the flow has a non-empty priced order,
  `StepFooter` shows a plain "order total" line just above the button row on every step
  (except the final review, which has its own recap) — so the amount stays visible from
  item selection through payment. The `catalog` step no longer renders its own total
  block and the `payment-stripe` step drops its in-step "Totale" callout for
  `amountSource: "cart"`.

### Changed

- `payment-stripe` step: the Payment Element amount now comes from
  `resolvePaymentAmount` (so an `amountSource: "cart"` step charges the order total built
  earlier in the flow, and shows a "Totale" callout). No Elements mount while the total
  is 0.
- `review` step: a final review renders an itemized order recap (`buildOrderSummary` —
  each catalog item with quantity/unit price, each priced option, the total) when the
  flow is priced, replacing the single-line total callout. The catalog step's own
  report row is hidden to avoid repeating the table. When the payment step carries a
  `calculateTax` function, the review calls it once on mount and adds a subtotal, the
  tax breakdown lines and a tax-inclusive total (with loading / error states).
- `payment-stripe` appearance: explicit borders for `.AccordionItem` / `.PickerItem` so
  the method list stays visible on light themes (the `flat` base theme drew none).

## 1.1.0 — 2026-09-03

### Changed

- **`payment-stripe` step: deferred model (breaking).** No more pay button on the step —
  it only collects a payment method (Stripe Payment Element in deferred mode, no network
  call on mount). The charge is your responsibility, from inside `<FlowRunner>`'s
  `onSubmit`: call `getPendingPayment(flow, answers)`, confirm on your backend, and throw
  if it fails — the FlowRunner keeps the user on the review step and shows the error under
  the submit button. See `docs/steps/payment-stripe.md`.
- The Stripe Payment Element's `appearance` is now derived from the active flow theme's
  tokens (accent, text, surfaces, radius, font).
- `review` step: renders a highlighted **total** callout when the flow has a collected
  payment; its submit button becomes "Completa pagamento e invia".
- Default theme renamed `notion-clean` → `warm-paper` (see `@flowkit-io/themes`); the
  `ThemeProvider` / `FlowRunner` default now resolves to `warmPaper`. Same palette.

### Added

- `Spinner` — an indeterminate circular loader whose arc uses the theme accent
  (`--fk-accent`), honouring `prefers-reduced-motion`. Replaces the plain-text loading
  line in the `payment-stripe` step.
- `.fk-footer-error` — a rejected `onSubmit` message shown above the footer buttons.

## 1.0.0 — 2026-09-01

### Added

- `radio` / `multi-select` step views render the opt-in `otherOption` "Altro" row: a
  free-text input (inside the choice card) whose value becomes (or is added to) the
  answer. New CSS `.fk-list-item-other` / `.fk-list-other-head` / `.fk-list-other-input`.
- `<FlowRunner>` `haptics` prop (default `true`): fires a short device vibration on the
  navigation buttons — continue/back/submit, review-row jumps, confirmation restart — and
  a distinct longer buzz on a blocked-while-invalid attempt. Needs the Vibration API
  (Android); a silent no-op on iOS Safari / desktop. Set `false` to opt out.
- `confirmation` step footer: honours the new `showRestartButton` flag (hide the restart
  button), and drops the footer bar entirely when both `showRestartButton` and
  `showHomeButton` are `false`. Restart button label stays configurable via `secondaryCta`.
- `<FlowOverlay>` (new opt-in subpath `@flowkit-io/react/overlay`): presents a flow in a
  portal as a bottom **drawer** (mobile-web sheet, swipe-down to dismiss), a centered
  **dialog**, or a **fullscreen** takeover, for embedding a flow without a dedicated page.
  Composes `<FlowRunner>` — all its props (incl. `haptics`) and the `ref` handle are
  forwarded. Controlled via `open` / `onOpenChange`;
  `presentation="drawer" | "dialog" | "fullscreen" | "auto"` (auto switches at a 640px
  viewport width). `dismissible`, `showCloseButton` (default on), `showTitle` (flow name
  top-right, like the playground status bar), `fixedHeight` (default on — a phone-portrait
  height via `--fk-overlay-height`), `closeOnSubmit`, `container`, `ariaLabel` props.
  Hand-rolled focus trap, body-scroll lock and Escape handling — no new runtime
  dependency. New CSS: `.fk-overlay*` classes and the `--fk-overlay-height` /
  `--fk-overlay-dialog-width` / `--fk-overlay-z` variables. Not re-exported from the main
  or `/lean` entry — use it alongside them.

### Changed

- **License:** relicensed from MIT to the **PolyForm Shield License 1.0.0**, effective
  this version — permanent, source-available, no competing use, no conversion.
- Internal `@flowkit-io/core` and `@flowkit-io/themes` dependency ranges bumped to
  `^1.0.0`.
- `0.x` releases remain MIT and are now legacy / unmaintained.

## 0.18.0 — 2026-08-07

### Added

- Depends on `@flowkit-io/core` `^0.15.0` for its new `returnToStep` navigation helper
  (used internally by `FlowRunner`'s review round trip — see core's changelog).

### Fixed

- Nested step titles inside a `group` step's items no longer inherit the same visual
  weight as the step's own title — CSS-only fix, descendant-scoped rules demote titles
  nested inside `.fk-group-item`.
- `FlowRunner`: fixed the branch/fork issues from `@flowkit-io/core` 0.15.0 on the
  rendering side — no more double-submit when returning to review after editing an
  answer reached from a clickable review row, `onChange` now receives the
  post-invalidation answers (not stale ones) after a branch-driving edit drops
  now-unreachable steps, and the Back button is now offered based on actual traversal
  history (`canGoBack`) rather than `index > 0`, which could be wrong after a branch
  jump or a resumed session.

### Changed

- "steps" progress variant overhauled: built from the steps of the *resolved* path
  (branches included). Inline per-step titles now render only for paths of up to 5
  steps and only once the stepper's own box is at least 480px wide (a CSS container
  query, not a viewport one — a flow embedded in a narrow frame on a wide screen keeps
  the compact layout); the current step's title/subtitle always get their own
  full-width row under the circles, which is now the only place a subtitle is shown.
  Paths longer than 7 steps collapse: first, last and the current step ±1 stay as
  numbered circles, every other contiguous run becomes a single `…` marker.
- CSS class `.fk-progress-step-subtitle` renamed to `.fk-progress-current-subtitle`
  (presentational only — not part of the zod config schema — but a breaking rename for
  any consumer overriding it by name).

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
