import { z } from "zod"
import { registerStepType } from "./registry"

/**
 * "signature" step (v2.25): user draws a signature (finger/mouse/stylus) on
 * a canvas. Value is a `data:image/png;base64,...` data URI. Base fields are
 * duplicated rather than imported from schema.ts's baseStepFields (not
 * exported) — same convention already established by group-step.ts for
 * files outside schema.ts.
 */
export const signatureStepSchema = z.object({
  id: z.string().min(1),
  type: z.literal("signature"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  required: z.boolean().default(true),
  icon: z.string().optional(),
  themeOverride: z.record(z.string(), z.unknown()).optional(),
  contentAlign: z.enum(["top", "center", "bottom"]).optional(),
  /** Height (px) of the inline (non-fullscreen) signature pad. Default: 220. */
  padHeight: z.number().positive().default(220),
  penColor: z.string().default("#2C2C2B"),
  backgroundColor: z.string().default("#FFFFFF"),
  /** Show the "clear" button. Default: true. */
  showClear: z.boolean().default(true),
  /** Show the "undo" (last stroke) button. Default: true. */
  showUndo: z.boolean().default(true),
})

export type SignatureStep = z.infer<typeof signatureStepSchema>

registerStepType({
  type: "signature",
  schema: signatureStepSchema,
  validate: (_step, value) => typeof value === "string" && value.startsWith("data:image/"),
})
