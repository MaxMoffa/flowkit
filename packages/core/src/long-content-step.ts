import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields } from "./schema"

/**
 * "long-content" step (v2.34): a content-only variant of "info" for long, scrollable
 * text (terms & conditions, privacy notice) — markdown `content`, rendered full-width
 * with its own independent scroll region (react side). `requireScrollToEnd` (default
 * false) gates advancing on the user having scrolled that region to the bottom, via
 * the existing per-step meta channel (setStepMeta/getStepMeta) rather than a stored
 * answer — like "info", adds no field to the flow and is excluded from the summary.
 */
export const longContentStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("long-content"),
  content: z.string(),
  requireScrollToEnd: z.boolean().default(false),
})

export type LongContentStep = z.infer<typeof longContentStepSchema>

registerStepType({
  type: "long-content",
  schema: longContentStepSchema,
  validate: (step, _value, _answers, meta) => !step.requireScrollToEnd || meta?.scrolledToEnd === true,
  includeInSummary: false,
})
