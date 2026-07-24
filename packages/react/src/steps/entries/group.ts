// Opt-in entry: import "@flowkit-io/react/steps/group" to register only this step.
import { registerStepComponent } from "../../registry"
import { GroupStepView } from "../group"

registerStepComponent("group", GroupStepView)
