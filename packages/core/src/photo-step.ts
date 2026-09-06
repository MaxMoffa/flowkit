import { z } from "zod"
import { registerStepType, type ValidationIssue } from "./registry"
import { baseStepFields } from "./schema"
import { isUploadedItemArray, matchesFileAccept, type UploadedItem } from "./upload-item"

/**
 * "photo" step — a dedicated, camera-only sibling of `media` (media-step.ts), not a
 * flag on it (same reasoning already applied to `product` vs `catalog`: a distinct
 * type keeps each config/component small and lets FlowLab offer a clearly different
 * catalog entry — "scatta una foto" vs "carica un file media" — rather than a hidden
 * toggle a builder user has to discover). Shows only the camera-capture affordance,
 * never a gallery/library picker.
 *
 * The component (photo.tsx) opens a live `getUserMedia` viewfinder in the step itself
 * (`useCameraStream`, preview-only — no decode loop, unlike `barcode-scan`) with a
 * shutter button that grabs the current frame onto a `<canvas>`; when the camera is
 * denied, absent, or unsupported it falls back to the previous `<input type="file"
 * accept="image/*" capture="environment">` mechanism (see DECISIONS.md) instead of
 * blocking the step. On desktop, where browsers ignore `capture`, that fallback input
 * degrades further to a normal file picker — same accepted degradation `media` has.
 *
 * Answer value: `UploadedItem[]` (upload-item.ts), the exact shape `media`/`file`
 * already produce — every image-only consumer (report rows, `MediaViewer`) keeps
 * working unmodified against a `photo` step's answer, regardless of which capture path
 * produced it.
 */
export const photoStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("photo"),
  /** How many photos can be captured. Default 1 (single shot). */
  maxPhotos: z.number().int().positive().default(1),
  /** Restrict accepted image MIME types/extensions (e.g. ["image/jpeg"]). Unset = any image. */
  imageFormats: z.array(z.string()).optional(),
  /** Maximum size per photo, in megabytes. Unset = no limit. */
  maxSizeMb: z.number().positive().optional(),
})

export type PhotoStep = z.infer<typeof photoStepSchema>

/** Same shape as `media`'s answer, restricted to images — see `UploadedItem`. */
export type PhotoValue = UploadedItem[]

function photoIssue(step: PhotoStep, value: unknown): ValidationIssue | null {
  if (!isUploadedItemArray(value) || value.length === 0) return { rule: "required" }

  if (value.length > step.maxPhotos) {
    return { rule: "outOfRange", params: { min: 1, max: step.maxPhotos } }
  }

  if (step.maxSizeMb !== undefined) {
    const tooBig = value.find((item: UploadedItem) => item.size > step.maxSizeMb! * 1024 * 1024)
    if (tooBig) return { rule: "fileTooLarge", params: { max: step.maxSizeMb, name: tooBig.name } }
  }

  if (step.imageFormats?.length) {
    const accept = step.imageFormats.join(",")
    const badType = value.find((item: UploadedItem) => !matchesFileAccept(item, accept))
    if (badType) return { rule: "invalidFileType", params: { accepted: accept, name: badType.name } }
  }

  return null
}

registerStepType({
  type: "photo",
  schema: photoStepSchema,
  validate: (step, value) => photoIssue(step, value) === null,
  getIssue: (step, value) => photoIssue(step, value),
})
