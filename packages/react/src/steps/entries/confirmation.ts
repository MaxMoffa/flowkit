// Opt-in entry: import "@flowkit-io/react/steps/confirmation" to register only this step.
import { registerStepComponent } from "../../registry"
import { ConfirmationStepView } from "../confirmation"

registerStepComponent("confirmation", ConfirmationStepView)
