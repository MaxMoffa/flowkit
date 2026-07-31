import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields } from "./schema"

export const reviewStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("review"),
  meta: z.string().optional(),
  /** Text of the final submit button. Default preserves the previous hardcoded text. */
  submitLabel: z.string().default("Invia segnalazione ✓"),
  /**
   * "final" (default): the flow's closing recap, must be the second-to-last step
   * (immediately before confirmation), at most one per flow. "checkpoint": a mid-flow
   * partial recap, any number allowed, exempt from the second-to-last positional rule.
   */
  mode: z.enum(["final", "checkpoint"]).default("final"),
})

export type ReviewStep = z.infer<typeof reviewStepSchema>

registerStepType({
  type: "review",
  schema: reviewStepSchema,
  validate: () => true,
  role: "review",
})
