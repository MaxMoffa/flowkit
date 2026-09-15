# @flowkit-io/presets

## 1.0.1 — 2026-09-15

### Fixed

- **"odori" preset**: removed the static `detectedLabel`/`detectedSubLabel` placeholder
  text ("Via Roma, 24" / "Battipaglia (SA) · ±15 m") on the location step — it printed
  regardless of the place actually picked (GPS or manual), instead of the real
  server-resolved address. The location step now shows only the real selected address.

## 1.0.0 — 2026-09-01

### Changed

- **License:** relicensed from MIT to the **PolyForm Shield License 1.0.0**, effective
  this version — permanent, no competing use, no conversion. No config changes.
- Internal `@flowkit-io/core` dependency range bumped to `^1.0.0`.
- `0.x` releases remain MIT and are now legacy / unmaintained.

## 0.3.3 — 2026-08-07

### Changed

- Bumped the internal `@flowkit-io/core` dependency range to `^0.15.0`, matching
  core's release in the same round — no source changes. See the same note in
  `@flowkit-io/adapters`'s changelog.

## 0.3.2 — 2026-08-04

### Changed

- Bumped the internal `@flowkit-io/core` dependency range to `^0.13.0`, matching
  core's release in the same round — no source changes. See the same note in
  `@flowkit-io/adapters`'s changelog.
