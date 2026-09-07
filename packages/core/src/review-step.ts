import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields, contentTextSchema } from "./schema"

export const reviewStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("review"),
  meta: z.string().optional(),
  /** Text of the final submit button. Unset (the common case) resolves at render time
   *  via `flow-runner.tsx`'s `primaryLabel` — the plain `submit` i18n text normally,
   *  or the payment-aware `submitWithPaymentAmount`/`submitWithPayment` text once the
   *  flow has a `payment-stripe` step (see `paymentSummary` below). A schema-level
   *  `.default(...)` here would always win over that resolution (zod fills it in at
   *  parse time, so `flow-runner.tsx`'s `?? resolveText(...)` fallback would never
   *  run) — this field must stay `.optional()`, not defaulted, for the payment-aware
   *  label to ever actually render. (v2.5x fix: it didn't, for exactly that reason —
   *  see DECISIONS.md.) */
  submitLabel: z.string().optional(),
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
  /**
   * Small print rendered under the submit button, in the footer — same mechanism as
   * the intro step's own `ctaFootnote` (restricted markdown, links allowed), but a
   * separate field so a platform like FlowLab can word the opening disclaimer and the
   * pre-submit one differently (e.g. "by submitting you confirm the data is correct
   * and accept [our terms](...)"). Purely presentational — no field, no validation.
   */
  ctaFootnote: contentTextSchema.optional(),
})

export type ReviewStep = z.infer<typeof reviewStepSchema>

registerStepType({
  type: "review",
  schema: reviewStepSchema,
  validate: () => true,
  role: "review",
})
