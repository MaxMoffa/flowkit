import { registerProgressComponent } from "../progress-registry"
import { BarProgress } from "./bar-progress"
import { DotsProgress } from "./dots-progress"

registerProgressComponent("bar", BarProgress)
registerProgressComponent("dots", DotsProgress)
