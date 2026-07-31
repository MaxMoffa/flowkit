// Opt-in entry: import "@flowkit-io/react/steps/long-content" to register only this step.
import { registerStepComponent } from "../../registry"
import { LongContentStepView } from "../long-content"

registerStepComponent("long-content", LongContentStepView)
