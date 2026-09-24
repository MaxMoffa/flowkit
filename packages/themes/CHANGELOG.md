# @flowkit-io/themes

## 1.1.2 — 2026-09-24

### Changed

- **`ThemeLayoutTokens.progressVariant`** now lists `"segments"` as a named literal
  (alongside `"bar"`/`"dots"`/`"steps"`/`"hidden"`), matching the progress variant of the
  same name added to `@flowkit-io/react`. The type already accepted any string via its
  catch-all, so this is editor-autocomplete only — no runtime change.

## 1.1.1 — 2026-09-24

### Fixed

- **`showcase` theme's page background no longer renders as one giant circle.** Its dot
  texture is now pre-tiled inside the SVG itself (a `<pattern>` over an 800×800 canvas)
  instead of a single 80×80 dot, which `background-size: cover; background-repeat:
  no-repeat` (built for full-bleed photos) was stretching to fill the whole flow.
  Affected both `showcaseLight` and `showcaseDark`.

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
