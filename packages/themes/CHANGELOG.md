# @flowkit-io/themes

## 1.1.0 — 2026-09-03

### Changed

- **Renamed the default theme `notion-clean` → `warm-paper` (breaking).** Exports
  `notionClean` / `notionCleanLight` / `notionCleanDark` are now `warmPaper` /
  `warmPaperLight` / `warmPaperDark`; the `themes` record key and `Theme.name` are
  `"warm-paper"`, the label is `"Warm Paper"`. No token or visual changes — the palette
  is identical.

### Added

- New theme **`scarlet-ink`** (`scarletInk`) — warm neutral with a scarlet-red accent
  (`#E04442` light / `#F16D66` dark), light + dark variants.

## 1.0.0 — 2026-09-01

### Changed

- **License:** relicensed from MIT to the **PolyForm Shield License 1.0.0**, effective
  this version — permanent, no competing use, no conversion. No token or API changes.
- `0.x` releases remain MIT and are now legacy / unmaintained.
