// Opt-in entry: import "@flowkit-io/react/steps/nps" to register only this step.
import { registerStepComponent } from "../../registry"
import { NpsStepView } from "../nps"

registerStepComponent("nps", NpsStepView)
