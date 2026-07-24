// Opt-in entry: import "@flowkit-io/react/steps/text" to register only this step.
import { registerStepComponent } from "../../registry"
import { TextStepView } from "../text"

registerStepComponent("text", TextStepView)
