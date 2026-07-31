// Opt-in entry: import "@flowkit-io/react/steps/branch" to register only this step.
import { registerStepComponent } from "../../registry"
import { BranchStepView } from "../branch"

registerStepComponent("branch", BranchStepView)
