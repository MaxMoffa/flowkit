// Separate entry: those who don't use the "payment-stripe" step shouldn't download Stripe.js.
// import "@flowkit-io/react/payment-stripe" to register the component.
import { registerStepComponent } from "./registry"
import { PaymentStripeStepView } from "./steps/payment-stripe"

registerStepComponent("payment-stripe", PaymentStripeStepView)
