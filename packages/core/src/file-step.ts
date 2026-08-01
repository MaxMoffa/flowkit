import { z } from "zod"
import { registerStepType, type ValidationIssue } from "./registry"
import { baseStepFields } from "./schema"
import { isUploadedItemArray, matchesFileAccept, resolveFileAccept, type UploadedItem } from "./upload-item"

export const fileFormatPresetSchema = z.enum(["any", "images", "documents", "pdf", "spreadsheets", "archives"])

export const fileStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("file"),
  placeholder: z.string().optional(),
  /** Allow selecting more than one file. Default: true. */
  multiple: z.boolean().default(true),
  /** Standard accepted-format preset. Default: "any". */
  formatPreset: fileFormatPresetSchema.default("any"),
  /** Free-form accept string (extensions and/or MIME types, e.g. ".csv,.zip"), combined with formatPreset. */
  customAccept: z.string().optional(),
  /** Maximum number of files the user can add. Unset = no limit. */
  maxItems: z.number().int().positive().optional(),
  /** Maximum size per file, in megabytes. Unset = no limit. */
  maxSizeMb: z.number().positive().optional(),
})

export type FileStep = z.infer<typeof fileStepSchema>

function fileStepIssue(step: FileStep, value: unknown): ValidationIssue | null {
  if (!isUploadedItemArray(value) || value.length === 0) return { rule: "required" }

  if (step.maxSizeMb !== undefined) {
    const tooBig = value.find((item: UploadedItem) => item.size > step.maxSizeMb! * 1024 * 1024)
    if (tooBig) return { rule: "fileTooLarge", params: { max: step.maxSizeMb, name: tooBig.name } }
  }

  const accept = resolveFileAccept(step.formatPreset, step.customAccept)
  if (accept) {
    const badType = value.find((item: UploadedItem) => !matchesFileAccept(item, accept))
    if (badType) return { rule: "invalidFileType", params: { accepted: accept, name: badType.name } }
  }

  return null
}

registerStepType({
  type: "file",
  schema: fileStepSchema,
  validate: (step, value) => fileStepIssue(step, value) === null,
  getIssue: (step, value) => fileStepIssue(step, value),
})
