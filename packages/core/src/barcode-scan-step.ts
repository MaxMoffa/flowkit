import { z } from "zod"
import { registerStepType, type ValidationIssue } from "./registry"
import { baseStepFields } from "./schema"

/**
 * Symbology names as standardized by the Barcode Detection API
 * (`BarcodeDetector.getSupportedFormats()` — see
 * https://wicg.github.io/shape-detection-api/#barcode-detection-api), reused verbatim
 * as this step's `formats` values so a config written against the native API and one
 * written against the ZXing fallback (barcode-scan.tsx maps these to ZXing's
 * `BarcodeFormat` enum) mean the same thing either way.
 */
export const barcodeFormatSchema = z.enum([
  "aztec",
  "code_128",
  "code_39",
  "code_93",
  "codabar",
  "data_matrix",
  "ean_13",
  "ean_8",
  "itf",
  "pdf417",
  "qr_code",
  "upc_a",
  "upc_e",
])

export type BarcodeFormat = z.infer<typeof barcodeFormatSchema>

/** Broad default accepted when `formats` is unset — every symbology above except the
 *  two least common ones (`codabar`, `itf`), which a builder can opt back in explicitly. */
export const DEFAULT_BARCODE_FORMATS: BarcodeFormat[] = [
  "aztec",
  "code_128",
  "code_39",
  "code_93",
  "data_matrix",
  "ean_13",
  "ean_8",
  "pdf417",
  "qr_code",
  "upc_a",
  "upc_e",
]

/**
 * "barcode-scan" step — live camera scan of a barcode/QR code, decoded in real time
 * (unlike `photo`, a single still capture can't decode anything: see DECISIONS.md for
 * the full architecture — native `BarcodeDetector` first, a dynamically-loaded ZXing
 * fallback when it's unavailable, and an always-reachable manual entry field as the
 * accessibility/robustness net).
 */
export const barcodeScanStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("barcode-scan"),
  /** Symbologies to accept. Unset = `DEFAULT_BARCODE_FORMATS`. */
  formats: z.array(barcodeFormatSchema).optional(),
  /** Always show a manual code-entry field alongside the camera view. Default true —
   *  the only accessibility/robustness net when the camera is denied, absent, or no
   *  code is found. */
  allowManualEntry: z.boolean().default(true),
})

export type BarcodeScanStep = z.infer<typeof barcodeScanStepSchema>

/** Answer value: the decoded code, and (when known) which symbology matched it. */
export interface BarcodeScanValue {
  code: string
  format?: BarcodeFormat | string
}

export function resolveBarcodeFormats(step: BarcodeScanStep): BarcodeFormat[] {
  return step.formats?.length ? step.formats : DEFAULT_BARCODE_FORMATS
}

/** Type guard + normalizer for a `barcode-scan` answer, the `asCatalogValue`/
 *  `asAddressValue` pattern other steps with a structured value already use — returns
 *  `null` for anything that isn't a valid `{ code }` (including an empty/blank code). */
export function asBarcodeScanValue(value: unknown): BarcodeScanValue | null {
  if (value === null || typeof value !== "object") return null
  const v = value as BarcodeScanValue
  return typeof v.code === "string" && v.code.trim().length > 0 ? v : null
}

function barcodeScanIssue(step: BarcodeScanStep, value: unknown): ValidationIssue | null {
  if (asBarcodeScanValue(value)) return null
  // Explicit, same as catalog-step.ts/product-step.ts/address-step.ts — the generic
  // `step.required === false` bypass in flow-validation.ts would already suppress a
  // "required" issue here too, but spelling it out locally keeps this step's own
  // required/optional behavior legible without relying on that generic fallback.
  return step.required ? { rule: "required" } : null
}

registerStepType({
  type: "barcode-scan",
  schema: barcodeScanStepSchema,
  validate: (step, value) => barcodeScanIssue(step, value) === null,
  getIssue: (step, value) => barcodeScanIssue(step, value),
})
