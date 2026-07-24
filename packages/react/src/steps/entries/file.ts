// Opt-in entry: import "@flowkit-io/react/steps/file" to register only this step.
import { registerStepComponent } from "../../registry"
import { FileStepView } from "../file"

registerStepComponent("file", FileStepView)
