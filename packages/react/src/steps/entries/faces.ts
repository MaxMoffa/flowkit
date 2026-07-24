// Opt-in entry: import "@flowkit-io/react/steps/faces" to register only this step.
import { registerStepComponent } from "../../registry"
import { FacesStepView } from "../faces"

registerStepComponent("faces", FacesStepView)
