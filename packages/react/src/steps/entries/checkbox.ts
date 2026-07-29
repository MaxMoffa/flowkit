// Opt-in entry: import "@flowkit-io/react/steps/checkbox" to register only this step.
import { registerStepComponent } from "../../registry"
import { CheckboxStepView } from "../checkbox"

registerStepComponent("checkbox", CheckboxStepView)
