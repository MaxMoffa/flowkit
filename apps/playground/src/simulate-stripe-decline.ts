import { getPendingPayment, type Answers, type Flow } from "@flowkit-io/core"

/**
 * The playground has no real backend, so `onSubmit` never actually calls
 * `PaymentIntent.confirm()` — the one place a Stripe charge can be declined. Without
 * this, every `payment-stripe` demo "succeeds" no matter which test card was entered,
 * including Stripe's own well-known *decline* test cards (see
 * https://docs.stripe.com/testing#declined-payments) — which is correct FlowKit
 * behavior (createConfirmationToken never attempts authorization, see
 * payment-stripe-step.ts's doc comment: the actual charge, and any decline, is the
 * consumer's backend's concern) but makes the demo unable to show what a declined
 * card looks like.
 *
 * Simulates that one backend decision client-side, keyed by the well-known test
 * cards' last4 (real backends key off the PaymentIntent's `last_payment_error` code
 * instead) — enough for the playground to demonstrate the flow's real error path
 * (`onSubmit` throws → FlowRunner keeps the user on review and shows the message,
 * see flow-runner.tsx's `submitError`) without a backend. No effect for any other
 * card/method (including the default success test card 4242 4242 4242 4242).
 */
const DECLINE_MESSAGE_BY_LAST4: Record<string, string> = {
  "0002": "Carta rifiutata dalla banca.",
  "9995": "Fondi insufficienti sulla carta.",
  "9987": "Carta segnalata come smarrita.",
  "9979": "Carta segnalata come rubata.",
  "0069": "Carta scaduta.",
  "0127": "CVC non corretto.",
  "0119": "Errore di elaborazione del pagamento, riprova.",
}

/** Throws (with the same message `flow-runner.tsx` would show for a real backend
 *  decline) when the collected payment method is one of Stripe's decline test cards.
 *  A no-op when the flow has no payment step, no method was collected yet, or the
 *  card isn't one of the known decline test numbers. */
export function simulateStripeTestCardOutcome(flow: Flow, answers: Answers): void {
  const pending = getPendingPayment(flow, answers)
  if (!pending || pending.summary.type !== "card" || !pending.summary.last4) return
  const message = DECLINE_MESSAGE_BY_LAST4[pending.summary.last4]
  if (message) throw new Error(message)
}
