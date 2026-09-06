// Opt-in entry: import "@flowkit-io/react/steps/photo" to register only this step.
import { registerStepComponent } from "../../registry"
import { PhotoStepView } from "../photo"

registerStepComponent("photo", PhotoStepView)
