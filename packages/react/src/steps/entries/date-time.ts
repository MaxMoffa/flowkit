// Opt-in entry: import "@flowkit-io/react/steps/date-time" to register only this step.
import { registerStepComponent } from "../../registry"
import { DateTimeStepView } from "../date-time"

registerStepComponent("date-time", DateTimeStepView)
