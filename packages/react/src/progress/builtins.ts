import { registerProgressComponent } from "../progress-registry"
import { BarProgress } from "./bar-progress"
import { DotsProgress } from "./dots-progress"
import { StepsProgress } from "./steps-progress"
import { SegmentsProgress } from "./segments-progress"

registerProgressComponent("bar", BarProgress)
registerProgressComponent("dots", DotsProgress)
registerProgressComponent("steps", StepsProgress)
registerProgressComponent("segments", SegmentsProgress)
