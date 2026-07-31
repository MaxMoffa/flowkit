import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields } from "./schema"

/**
 * "verification" step: blocks advancement until a human-verification widget
 * (Cloudflare Turnstile or Google reCAPTCHA) succeeds. The component never
 * checks the secret key itself (would require it client-side) — `verifyToken`
 * is a callback injected by the consumer (same pattern as
 * `payment-stripe.createPaymentIntent`/`resultActions.resultLink.createLink`),
 * expected to call the consumer's own backend, which holds the provider's
 * secret key and calls Cloudflare's/Google's siteverify endpoint.
 */
export const verificationProviderSchema = z.enum(["turnstile", "recaptcha"])
export type VerificationProvider = z.infer<typeof verificationProviderSchema>

export const verificationStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("verification"),
  provider: verificationProviderSchema,
  /** Public site key for the chosen provider. Never a secret key. */
  siteKey: z.string().min(1),
  /**
   * Set to false to keep the step in the flow (same structure across
   * environments) but skip verification entirely — e.g. in development/test,
   * or behind a feature flag. When false, the step always validates and the
   * component never loads the provider's script/widget.
   */
  enabled: z.boolean().default(true),
  /**
   * When true, never loads the provider's script or renders the widget: the
   * step immediately shows the same "verified" success state a real pass
   * would, without calling verifyToken or spending a real challenge. Unlike
   * enabled:false (which shows nothing at all, for hiding the step behind a
   * feature flag), this is for previewing/demoing the step's full UI without
   * consuming the anti-bot provider's API. Ignored (real widget shown as
   * normal) if enabled is false. Default false: the widget shows as today.
   */
  previewVerified: z.boolean().default(false),
  /**
   * Must call the consumer's own backend to verify the widget token
   * server-side against the provider's siteverify endpoint, resolving true
   * only on success.
   */
  verifyToken: z.custom<(token: string, provider: VerificationProvider) => Promise<boolean>>(
    (v) => typeof v === "function",
  ),
})

export type VerificationStep = z.infer<typeof verificationStepSchema>

export interface VerificationValue {
  verified: boolean
  token?: string
  provider: VerificationProvider
}

registerStepType({
  type: "verification",
  schema: verificationStepSchema,
  validate: (step, value) =>
    step.enabled === false ||
    step.previewVerified === true ||
    (value as VerificationValue | null)?.verified === true,
})
