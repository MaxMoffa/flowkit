// Separate entry: those who don't use the "payment-stripe" step shouldn't download Stripe.js.
// import "@flowkit-io/react/payment-stripe" to register the component.
import { loadStripe } from "@stripe/stripe-js"
import { registerStepComponent, registerStripeNextActionRunner } from "./registry"
import { PaymentStripeStepView } from "./steps/payment-stripe"

registerStepComponent("payment-stripe", PaymentStripeStepView)

/**
 * 3DS/SCA for the deferred model. The consumer's backend confirms the
 * PaymentIntent at the flow's final submit; a card that needs authentication
 * comes back `requires_action`. The consumer throws `PaymentRequiresActionError`
 * (from `@flowkit-io/core`) with the PaymentIntent's `client_secret` and
 * FlowRunner calls this runner to finish the challenge in the browser, then
 * re-invokes `onSubmit` once so the backend can re-confirm and persist.
 *
 * This is the only place Stripe.js is loaded — registered from this opt-in entry
 * so the main bundle stays Stripe-free.
 */
registerStripeNextActionRunner(async ({ publishableKey, stripeAccount, clientSecret }) => {
  const stripe = await loadStripe(
    publishableKey,
    stripeAccount ? { stripeAccount } : undefined,
  )
  if (!stripe) return { ok: false, error: "Stripe.js non è stato caricato." }
  const { error } = await stripe.handleNextAction({ clientSecret })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
})
