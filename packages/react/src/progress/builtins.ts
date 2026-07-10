import { registerProgressComponent } from "../progress-registry"
import { BarProgress } from "./BarProgress"
import { DotsProgress } from "./DotsProgress"

registerProgressComponent("bar", BarProgress)
registerProgressComponent("dots", DotsProgress)
