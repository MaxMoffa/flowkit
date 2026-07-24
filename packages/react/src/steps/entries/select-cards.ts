// Opt-in entry: import "@flowkit-io/react/steps/select-cards" to register only this step.
import { registerStepComponent } from "../../registry"
import { SelectCardsStepView } from "../select-cards"

registerStepComponent("select-cards", SelectCardsStepView)
