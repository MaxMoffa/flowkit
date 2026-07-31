import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields } from "./schema"

/**
 * "info" step (v2.34): pure content — title, subtitle, image, same visual structure
 * as "intro" (the react side reuses IntroLikeView) — but with no `role`, so unlike
 * intro it can appear anywhere in the flow, any number of times. Adds no field to the
 * flow: it never calls onChange, and is excluded from the summary/payload via
 * includeInSummary:false.
 */
export const infoStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("info"),
})

export type InfoStep = z.infer<typeof infoStepSchema>

registerStepType({
  type: "info",
  schema: infoStepSchema,
  validate: () => true,
  includeInSummary: false,
})
