import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields } from "./schema"

export const mediaStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("media"),
  placeholder: z.string().optional(),
  /** Allow selecting/capturing more than one item. Default: true. */
  multiple: z.boolean().default(true),
  /** Accept image files. Default: true. */
  acceptImages: z.boolean().default(true),
  /** Accept video files. Default: false. */
  acceptVideos: z.boolean().default(false),
  /** Restrict accepted image MIME types/extensions (e.g. ["image/jpeg","image/png"]). Unset = any image. */
  imageFormats: z.array(z.string()).optional(),
  /** Restrict accepted video MIME types/extensions (e.g. ["video/mp4"]). Unset = any video. */
  videoFormats: z.array(z.string()).optional(),
  /** Maximum number of items the user can add. Unset = no limit. */
  maxItems: z.number().int().positive().optional(),
})

export type MediaStep = z.infer<typeof mediaStepSchema>

registerStepType({
  type: "media",
  schema: mediaStepSchema,
  validate: (_step, value) => Array.isArray(value) && value.length > 0,
  getIssue: (_step, value) => (Array.isArray(value) && value.length > 0 ? null : { rule: "required" }),
})
