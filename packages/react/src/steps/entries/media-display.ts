// Opt-in entry: import "@flowkit-io/react/steps/media-display" to register only this step.
import { registerStepComponent } from "../../registry"
import { MediaDisplayStepView } from "../media-display"

registerStepComponent("media-display", MediaDisplayStepView)
