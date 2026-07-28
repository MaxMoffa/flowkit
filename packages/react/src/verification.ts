// Separate entry: those who don't use the "verification" step shouldn't have this
// module inject Turnstile/reCAPTCHA's external <script> tag.
// import "@flowkit-io/react/verification" to register the component.
import { registerStepComponent } from "./registry"
import { VerificationStepView } from "./steps/verification"

registerStepComponent("verification", VerificationStepView)
