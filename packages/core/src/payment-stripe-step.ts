import { z } from "zod"
import type { Flow } from "./schema"
import type { Answers } from "./machine"
import { answerKey } from "./machine"
import { registerStepType } from "./registry"
import { baseStepFields } from "./schema"
import { computeOrderTotal } from "./catalog-step"
import type { CalculateTax } from "./tax"

/**
 * "payment-stripe" step — deferred model (since v2.40).
 *
 * The step only *collects* a payment method: it mounts the Stripe Payment
 * Element in deferred mode (no PaymentIntent, no `clientSecret`, no backend call
 * on mount) and, once the user has filled it in, mints a single-use
 * ConfirmationToken entirely client-side (needs only the publishable key).
 *
 * The actual charge is deferred to the flow's final submit — the review step's
 * button — so a user can never pay and then abandon the flow before the report
 * is sent. The consumer performs the charge from inside their `onSubmit`
 * handler: call `getPendingPayment(flow, answers)` to get the collected
 * ConfirmationToken, hand it to your backend to
 * `PaymentIntent.create({ confirmation_token, confirm: true, ... })`, and throw
 * from `onSubmit` if it fails so the FlowRunner keeps the user on the review
 * step and surfaces the error.
 */
export const paymentStripeStepSchema = z
  .object({
    ...baseStepFields,
    type: z.literal("payment-stripe"),
    /** Stripe PUBLISHABLE key only — never a secret key. Enforced by naming/docs, not by code. */
    publishableKey: z.string().min(1),
    /**
     * Where the charged amount comes from:
     * - `"fixed"` (default): the static `amount` below — a single-price checkout.
     * - `"cart"`: the sum of every priced selection earlier in the flow
     *   (`computeOrderTotal` — `catalog` steps and priced options on
     *   select-cards/multi-select/radio/chips), plus `amount` as a flat surcharge
     *   (shipping, booking fee…) when set. Lets the visitor build their own order.
     */
    amountSource: z.enum(["fixed", "cart"]).default("fixed"),
    /**
     * Amount in the currency's minor unit (e.g. cents for EUR/USD). Required and
     * positive when `amountSource` is `"fixed"`; an optional flat surcharge added on
     * top of the cart total when `amountSource` is `"cart"`. Shown to Stripe so it
     * can offer the right payment methods, and rendered as the total on the review step.
     */
    amount: z.number().int().nonnegative().optional(),
    currency: z.string().length(3).default("eur"),
    description: z.string().optional(),
    /** Stripe Connect destination account, optional. */
    stripeAccount: z.string().optional(),
    /** Label of the "change the selected method" button shown once a method is picked. */
    changeLabel: z.string().default("Cambia"),
    /**
     * When true, never loads Stripe Elements: the step immediately shows the same
     * "method selected" summary a real collected payment method would (a fake
     * "Visa •••• 4242" card) and synthesizes that value via `onChange`, without
     * calling `loadStripe`/mounting the Payment Element or spending a real Stripe
     * API call. For previewing/demoing the step's full UI (and letting the rest of
     * the flow — review, submit — be exercised end-to-end) without a working
     * publishable key. Ignored (real widget shown as normal) once the visitor picks
     * "Cambia" to edit. Default false: the widget shows as today.
     */
    previewSelected: z.boolean().default(false),
    /** Whether item prices already include tax (`"inclusive"`) or tax is added on
     *  top (`"exclusive"`, default). Mirrors Stripe's `tax_behavior`; only meaningful
     *  when `calculateTax` is wired. */
    taxBehavior: z.enum(["inclusive", "exclusive"]).default("exclusive"),
    /**
     * Platform-injected (never serialized — see `verifyToken`). When present, the
     * review step calls it with the order lines + the `address` step's answer and
     * shows the returned tax breakdown / tax-inclusive total. The charged amount is
     * still re-derived server-side. Absent = no tax line is shown.
     */
    calculateTax: z.custom<CalculateTax>((v) => typeof v === "function").optional(),
  })
  .refine(
    (step) => step.amountSource === "cart" || (typeof step.amount === "number" && step.amount > 0),
    { message: "A fixed-amount payment step needs a positive `amount`.", path: ["amount"] },
  )

export type PaymentStripeStep = z.infer<typeof paymentStripeStepSchema>

/** Human-readable preview of the payment method the user picked, derived from the
 *  ConfirmationToken's `payment_method_preview`. `type` is Stripe's payment method
 *  type ("card", "paypal", "klarna", …); `brand`/`last4` are only present for cards. */
export type PaymentMethodSummary = {
  type: string
  brand?: string
  last4?: string
}

/**
 * The step's answer value. `status` is always `"collected"` once a method is
 * picked — the step never confirms the payment itself, so it never reaches
 * "succeeded"/"failed" on its own. The charge happens later, in the consumer's
 * `onSubmit`; whether it succeeded is the consumer's concern, not the flow's.
 */
export type PaymentStripeValue = {
  status: "collected"
  /** Single-use ConfirmationToken id — pass to `PaymentIntent.create/confirm` server-side. */
  confirmationTokenId: string
  summary: PaymentMethodSummary
}

function asPaymentStripeValue(value: unknown): PaymentStripeValue | null {
  if (value === null || typeof value !== "object") return null
  const current = value as PaymentStripeValue
  return current.status === "collected" && typeof current.confirmationTokenId === "string" ? current : null
}

registerStepType({
  type: "payment-stripe",
  schema: paymentStripeStepSchema,
  validate: (step, value) => step.previewSelected === true || asPaymentStripeValue(value) !== null,
})

/**
 * The amount this step will charge, in the step's currency minor unit. For
 * `amountSource: "fixed"` it is the static `amount`; for `"cart"` it is the
 * flow's order total (`computeOrderTotal`) plus the optional flat `amount`
 * surcharge. Use it wherever the total is shown or charged — the react step's
 * Payment Element, the review callout, the server-side confirm — so all three
 * agree.
 */
export function resolvePaymentAmount(step: PaymentStripeStep, flow: Flow, answers: Answers): number {
  const surcharge = typeof step.amount === "number" ? step.amount : 0
  if (step.amountSource === "cart") return computeOrderTotal(flow, answers) + surcharge
  return surcharge
}

/** Data a consumer needs to finalize a deferred payment from inside `onSubmit`. */
export interface PendingPayment {
  /** Id of the `payment-stripe` step the method was collected on. */
  stepId: string
  confirmationTokenId: string
  amount: number
  currency: string
  summary: PaymentMethodSummary
}

/**
 * Finds the flow's `payment-stripe` step and, if the user collected a payment
 * method on it, returns everything needed to confirm the charge server-side.
 * Returns `null` when the flow has no payment step, or the method wasn't
 * collected.
 *
 * Call it in your `onSubmit`: if it returns a value, hand `confirmationTokenId`
 * (+ `amount`/`currency`) to your backend to
 * `PaymentIntent.create({ confirmation_token, confirm: true })`; throw from
 * `onSubmit` if the charge fails so the FlowRunner keeps the user on the review
 * step and surfaces the error.
 *
 * Assumes at most one `payment-stripe` step per flow — the first one wins.
 */
export function getPendingPayment(flow: Flow, answers: Answers): PendingPayment | null {
  for (const step of flow.steps) {
    if (step.type !== "payment-stripe") continue
    const paymentStep = step as PaymentStripeStep
    const value = asPaymentStripeValue(answers[answerKey(paymentStep)])
    if (!value) return null
    return {
      stepId: paymentStep.id,
      confirmationTokenId: value.confirmationTokenId,
      amount: resolvePaymentAmount(paymentStep, flow, answers),
      currency: paymentStep.currency,
      summary: value.summary,
    }
  }
  return null
}

/** True when the flow has a `payment-stripe` step at all (regardless of whether a
 *  method has been collected yet) — used by the review step to switch its submit
 *  label to the "pay & submit" variant. */
export function flowHasPayment(flow: Flow): boolean {
  return flow.steps.some((s) => s.type === "payment-stripe")
}
