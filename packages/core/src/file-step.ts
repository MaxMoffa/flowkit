import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields } from "./schema"

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
})

export type FileStep = z.infer<typeof fileStepSchema>

registerStepType({
  type: "file",
  schema: fileStepSchema,
  validate: (_step, value) => Array.isArray(value) && value.length > 0,
})
