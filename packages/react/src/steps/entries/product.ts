// Opt-in entry: import "@flowkit-io/react/steps/product" to register only this step.
import { registerStepComponent } from "../../registry"
import { ProductStepView } from "../product"

registerStepComponent("product", ProductStepView)
