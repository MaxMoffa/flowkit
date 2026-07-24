// Opt-in entry: import "@flowkit-io/react/steps/review" to register only this step.
import { registerStepComponent } from "../../registry"
import { ReviewStepView } from "../review"

registerStepComponent("review", ReviewStepView)
