import { getPendingPayment, PaymentRequiresActionError, type Answers, type Flow } from "@flowkit-io/core"
import { registerStripeNextActionRunner } from "@flowkit-io/react"

/**
 * Playground stand-in for a card that needs 3D Secure. The real deferred flow is:
 * the backend confirms the PaymentIntent at submit, an SCA card comes back
 * `requires_action`, `onSubmit` throws `PaymentRequiresActionError`, FlowRunner
 * runs `stripe.handleNextAction` in the browser and re-submits once. The
 * playground has no backend and can't run a real challenge, so this fakes both
 * ends — keyed on Stripe's own "authentication required" test card
 * `4000 0025 0000 3155` (see https://docs.stripe.com/testing#regulatory-cards).
 */
const THREE_DS_LAST4 = "3155"

/** Synthetic client secrets that have "passed" the fake challenge — so the
 *  re-submit FlowRunner fires after a confirmed challenge goes through. */
const authenticated = new Set<string>()

function clientSecretFor(confirmationTokenId: string): string {
  return `pi_demo_${confirmationTokenId}_secret`
}

let installed = false

/**
 * Registers a mock `stripe.handleNextAction` over the real runner (a `window.confirm`
 * stands in for Stripe's challenge modal). Call it *after* importing
 * `@flowkit-io/react/payment-stripe` so it wins — see `opt-in-steps.ts`.
 */
export function installMock3dsRunner(): void {
  if (installed) return
  installed = true
  registerStripeNextActionRunner(async ({ clientSecret }) => {
    const ok = window.confirm(
      "Simulazione 3D Secure\n\nLa carta richiede l'autenticazione della banca. Confermare la challenge?",
    )
    if (ok) authenticated.add(clientSecret)
    return ok ? { ok: true } : { ok: false, error: "Autenticazione 3D Secure annullata." }
  })
}

/**
 * Deferred-charge stand-in for the 3DS test card: the first `onSubmit` throws
 * `PaymentRequiresActionError`, the re-submit after a confirmed challenge is a
 * no-op (lets the flow complete). A no-op for every other card/method.
 */
export function simulateStripe3dsOutcome(flow: Flow, answers: Answers): void {
  const pending = getPendingPayment(flow, answers)
  if (!pending || pending.summary.type !== "card" || pending.summary.last4 !== THREE_DS_LAST4) return
  const clientSecret = clientSecretFor(pending.confirmationTokenId)
  if (authenticated.has(clientSecret)) return
  throw new PaymentRequiresActionError(clientSecret)
}
