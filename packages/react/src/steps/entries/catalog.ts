// Opt-in entry: import "@flowkit-io/react/steps/catalog" to register only this step.
import { registerStepComponent } from "../../registry"
import { CatalogStepView } from "../catalog"

registerStepComponent("catalog", CatalogStepView)
