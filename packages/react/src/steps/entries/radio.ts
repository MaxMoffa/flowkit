// Opt-in entry: import "@flowkit-io/react/steps/radio" to register only this step.
import { registerStepComponent } from "../../registry"
import { RadioStepView } from "../radio"

registerStepComponent("radio", RadioStepView)
