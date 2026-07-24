// Opt-in entry: import "@flowkit-io/react/steps/oauth" to register only this step.
import { registerStepComponent } from "../../registry"
import { OAuthStepView } from "../oauth"

registerStepComponent("oauth", OAuthStepView)
