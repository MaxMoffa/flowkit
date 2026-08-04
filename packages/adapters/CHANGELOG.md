# @flowkit-io/adapters

## 0.2.3 — 2026-08-04

### Changed

- Bumped the internal `@flowkit-io/core` dependency range to `^0.13.0`, matching
  core's release in the same round — no source changes. On 0.x versions npm's caret
  range is minor-locked, so leaving this pinned to `^0.12.0` after core moved to
  `0.13.0` would risk a silently duplicated, stale nested `@flowkit-io/core` (see the
  repo's `DECISIONS.md` for a prior real incident of this).
