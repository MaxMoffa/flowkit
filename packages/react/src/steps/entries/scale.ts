// Opt-in entry: import "@flowkit-io/react/steps/scale" to register only this step.
import { registerStepComponent } from "../../registry"
import { ScaleStepView } from "../scale"

registerStepComponent("scale", ScaleStepView)
