// Opt-in entry: import "@flowkit-io/react/steps/subflow" to register only this step.
import { registerStepComponent } from "../../registry"
import { SubflowStepView } from "../subflow"

registerStepComponent("subflow", SubflowStepView)
