# @flowkit-io/react

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
