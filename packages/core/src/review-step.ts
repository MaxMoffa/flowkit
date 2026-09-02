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
  /**
   * "auto" (default): when the flow contains a `payment-stripe` step whose method
   * was collected, a final review step shows the amount as a highlighted callout
   * at the top and its submit button becomes the "pay & submit" label. "hidden"
   * opts out of the callout (the button label still changes) for consumers who
   * render the total themselves.
   */
  paymentSummary: z.enum(["auto", "hidden"]).default("auto"),
})

export type ReviewStep = z.infer<typeof reviewStepSchema>

registerStepType({
  type: "review",
  schema: reviewStepSchema,
  validate: () => true,
  role: "review",
})
