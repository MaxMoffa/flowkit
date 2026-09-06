// Opt-in entry: import "@flowkit-io/react/steps/barcode-scan" to register only this step.
import { registerStepComponent } from "../../registry"
import { BarcodeScanStepView } from "../barcode-scan"

registerStepComponent("barcode-scan", BarcodeScanStepView)
