// Opt-in entry: import "@flowkit-io/react/steps/media" to register only this step.
import { registerStepComponent } from "../../registry"
import { MediaStepView } from "../media"

registerStepComponent("media", MediaStepView)
