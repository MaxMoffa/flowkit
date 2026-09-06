# `barcode-scan`

Live scan of a barcode/QR code, decoded in real time from the camera stream. Answer
value: `{ code: string, format?: string }`. Component: `BarcodeScanStepView`.

<StepPreview type="barcode-scan" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `formats` | `BarcodeFormat[]` | broad default set | Symbologies to accept — see below |
| `allowManualEntry` | `boolean` | `true` | Always show a manual code-entry field alongside the camera view |

`BarcodeFormat` is one of the [Barcode Detection API](https://wicg.github.io/shape-detection-api/#barcode-detection-api)'s
standard symbology names: `aztec`, `code_128`, `code_39`, `code_93`, `codabar`,
`data_matrix`, `ean_13`, `ean_8`, `itf`, `pdf417`, `qr_code`, `upc_a`, `upc_e`. Left
unset, the step accepts a broad default set (everything above except `codabar`/`itf`,
the least common two — opt back in explicitly if you need them).

## How it decodes

1. **Native `BarcodeDetector`** (`"BarcodeDetector" in window`) when available —
   Chrome/Edge/Android, the majority of mobile traffic, zero extra download.
   `getUserMedia({ video: { facingMode: "environment" } })` opens the stream, a
   `requestAnimationFrame` loop calls `detector.detect(videoElement)`.
2. **ZXing fallback** when it isn't (Safari/iOS chiefly): a pinned UMD build of
   `@zxing/library` is loaded from jsDelivr *only once this step actually mounts*
   (same on-demand pattern the `verification` step uses for Turnstile/reCAPTCHA — see
   `loadExternalScript`). No dependency is added to the package itself.
3. **Manual entry**, always reachable (not hidden behind an error) whenever
   `allowManualEntry` isn't `false` — the accessibility/robustness net for a denied
   permission, no camera, a decode timeout, or an unsupported browser with no working
   fallback. Typing feeds the answer directly, keystroke by keystroke (same pattern as
   `text`/`notes` — no separate "confirm" button); the flow footer's own "Continua" is
   the only advance action. A manually typed code never carries `format`, which is
   exactly how the step tells it apart from a camera-decoded one: only a `format`-
   carrying value swaps the view to "found ✅ + rescan" — plain typing stays in the
   editable field even though it's already a valid answer. If the camera finds a code
   while the field has partial text in it, the camera result wins (it overwrites the
   answer) and the manual field clears.

The camera stream is stopped (`MediaStream` tracks + decoder released) the moment a
code is found, on unmount, and on step change — it's never left running past the step
that opened it.

States are announced for screen readers (`role="status" aria-live="polite"` on the
scanning banner): requesting permission, permission denied, no camera, scanning, load
error, code found.

## Example

```ts
{ id: "sku", type: "barcode-scan", title: "Scan the product barcode" }

// QR codes only, camera-only (no manual fallback):
{ id: "ticket", type: "barcode-scan", formats: ["qr_code"], allowManualEntry: false }
```

[← All steps](./index.md) · See also [`photo`](./photo.md)
