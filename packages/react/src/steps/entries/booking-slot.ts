// Opt-in entry: import "@flowkit-io/react/steps/booking-slot" to register only this step.
import { registerStepComponent } from "../../registry"
import { BookingSlotStepView } from "../booking-slot"

registerStepComponent("booking-slot", BookingSlotStepView)
