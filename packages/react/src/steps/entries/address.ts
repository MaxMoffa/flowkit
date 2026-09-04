// Opt-in entry: import "@flowkit-io/react/steps/address" to register only this step.
import { registerStepComponent } from "../../registry"
import { AddressStepView } from "../address"

registerStepComponent("address", AddressStepView)
