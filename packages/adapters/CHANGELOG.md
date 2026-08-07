# @flowkit-io/adapters

## 0.2.5 — 2026-08-07

### Changed

- Bumped the internal `@flowkit-io/core` dependency range to `^0.15.0`, matching
  core's release in the same round — no source changes. On 0.x versions npm's caret
  range is minor-locked, so leaving this pinned to `^0.14.0` after core moved to
  `0.15.0` would risk a silently duplicated, stale nested `@flowkit-io/core` (see the
  repo's `DECISIONS.md` for a prior real incident of this).

## 0.2.4 — 2026-08-04

### Changed

- Internal refactor: `rest.ts`, `notion.ts` and `receipt-email-adapter.ts` now share a
  `requestJson` fetch-and-check helper (`http.ts`) instead of each repeating the same
  fetch/error-check pattern. No behavior change.

## 0.2.3 — 2026-08-04

### Changed

- Bumped the internal `@flowkit-io/core` dependency range to `^0.13.0`, matching
  core's release in the same round — no source changes. On 0.x versions npm's caret
  range is minor-locked, so leaving this pinned to `^0.12.0` after core moved to
  `0.13.0` would risk a silently duplicated, stale nested `@flowkit-io/core` (see the
  repo's `DECISIONS.md` for a prior real incident of this).
