// Opt-in entry: import "@flowkit-io/react/steps/info" to register only this step.
import { registerStepComponent } from "../../registry"
import { InfoStepView } from "../info"

registerStepComponent("info", InfoStepView)
