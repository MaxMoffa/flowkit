// Opt-in entry: import "@flowkit-io/react/steps/chips" to register only this step.
import { registerStepComponent } from "../../registry"
import { ChipsStepView } from "../chips"

registerStepComponent("chips", ChipsStepView)
