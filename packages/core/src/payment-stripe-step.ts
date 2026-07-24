import { z } from "zod"
import { registerStepType } from "./registry"

/**
 * "payment-stripe" step (v2.25): collects a Stripe payment via the Payment
 * Element. The component never creates the PaymentIntent itself (would
 * require a secret key client-side) — `createPaymentIntent` is a callback
 * injected by the consumer (same pattern as `resultActions.resultLink.createLink`
 * /`resultActions.emailApi.sendEmail` in confirmationStepSchema), expected to
 * call the consumer's own backend, which holds the Stripe secret key.
 */
export const paymentStripeStepSchema = z.object({
  id: z.string().min(1),
  type: z.literal("payment-stripe"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  required: z.boolean().default(true),
  icon: z.string().optional(),
  themeOverride: z.record(z.string(), z.unknown()).optional(),
  contentAlign: z.enum(["top", "center", "bottom"]).optional(),
  /** Stripe PUBLISHABLE key only — never a secret key. Enforced by naming/docs, not by code. */
  publishableKey: z.string().min(1),
  /** Amount in the currency's minor unit (e.g. cents for EUR/USD). */
  amount: z.number().int().positive(),
  currency: z.string().length(3).default("eur"),
  description: z.string().optional(),
  /** Stripe Connect destination account, optional. */
  stripeAccount: z.string().optional(),
  buttonLabel: z.string().default("Paga ora"),
  /**
   * Must call the consumer's own backend to create a PaymentIntent there
   * (server-side, with the secret key) and return its client secret.
   */
  createPaymentIntent: z.custom<
    (params: {
      amount: number
      currency: string
      metadata?: Record<string, string>
    }) => Promise<{ clientSecret: string }>
  >((v) => typeof v === "function"),
})

export type PaymentStripeStep = z.infer<typeof paymentStripeStepSchema>

export type PaymentStripeValue = {
  status: "succeeded" | "processing" | "failed"
  paymentIntentId?: string
}

registerStepType({
  type: "payment-stripe",
  schema: paymentStripeStepSchema,
  validate: (_step, value) => (value as PaymentStripeValue | null)?.status === "succeeded",
})
