import type { IntroStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { IntroLikeView } from "./shared/intro-like"

export function IntroStepView({ step }: StepComponentProps<IntroStep>) {
  return (
    <div className="fk-step fk-step-intro">
      <IntroLikeView title={step.title} subtitle={step.subtitle} image={step.image} livePill={step.livePill} />
    </div>
  )
}
