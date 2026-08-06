import { registerProgressComponent } from "../progress-registry"
import { BarProgress } from "./bar-progress"
import { DotsProgress } from "./dots-progress"
import { StepsProgress } from "./steps-progress"

registerProgressComponent("bar", BarProgress)
registerProgressComponent("dots", DotsProgress)
registerProgressComponent("steps", StepsProgress)
