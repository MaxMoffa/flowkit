# `photo`

Camera-only capture — no gallery/library picker, ever. Dedicated type, not a flag on
[`media`](./media.md) (same reasoning as `product` vs `catalog`: a distinct catalog
entry beats a hidden toggle). Answer value: `UploadedItem[]` (`{ id, name, mimeType,
size, dataUrl, kind: "image" }`) — the exact shape `media`/`file` already produce, so
report rows, `MediaViewer` and export code handle a `photo` answer with no
special-casing. Component: `PhotoStepView`.

<StepPreview type="photo" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `maxPhotos` | `number` | `1` | How many photos can be captured |
| `imageFormats` | `string[]` | — (any image) | Restrict accepted image MIME types/extensions |
| `maxSizeMb` | `number` | — (no limit) | Maximum size per photo, in megabytes |

Opens a **live camera viewfinder** in the step itself (`getUserMedia({ video:
{ facingMode: "environment" } })`, preview-only — no decode loop, unlike
[`barcode-scan`](./barcode-scan.md)) with a shutter button that grabs the current
frame onto a `<canvas>` and turns it into the same kind of file `media`/`file`
produce. The stream stays open across shots while `maxPhotos` allows another one, and
stops the instant it doesn't (or on unmount/step change) — never left running past the
step.

When the camera is denied, absent, or unsupported, the step degrades to the previous
`<input type="file" accept="image/*" capture="environment">` mechanism instead of
blocking — on mobile that opens the native camera app directly; on desktop, where
browsers ignore `capture`, it degrades further to a normal file picker (same accepted
fallback `media` has). Either path — live shutter or fallback input — feeds the same
pipeline, so captured photos always show as a thumbnail grid; each opens the shared
`MediaViewer` (zoom, swipe/keyboard navigation, delete) on click. Camera status
(requesting permission, denied, no camera) is announced via `role="status"
aria-live="polite"`.

## Example

```ts
{ id: "receipt", type: "photo", title: "Photograph the receipt", required: false }

// up to 3 photos, JPEG only, 8 MB max each:
{ id: "damage", type: "photo", maxPhotos: 3, imageFormats: ["image/jpeg"], maxSizeMb: 8 }
```

[← All steps](./index.md) · See also [`media`](./media.md), [`barcode-scan`](./barcode-scan.md)
