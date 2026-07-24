// Opt-in entry: import "@flowkit-io/react/steps/intro" to register only this step.
import { registerStepComponent } from "../../registry"
import { IntroStepView } from "../intro"

registerStepComponent("intro", IntroStepView)
