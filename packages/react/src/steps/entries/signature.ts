// Opt-in entry: import "@flowkit-io/react/steps/signature" to register only this step.
import { registerStepComponent } from "../../registry"
import { SignatureStepView } from "../signature"

registerStepComponent("signature", SignatureStepView)
