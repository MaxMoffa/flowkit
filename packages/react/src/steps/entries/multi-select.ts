// Opt-in entry: import "@flowkit-io/react/steps/multi-select" to register only this step.
import { registerStepComponent } from "../../registry"
import { MultiSelectStepView } from "../multi-select"

registerStepComponent("multi-select", MultiSelectStepView)
