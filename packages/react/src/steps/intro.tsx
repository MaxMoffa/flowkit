import type { IntroStep } from "@flowkit-io/core"
import { resolveContentText } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { IntroLikeView } from "./shared/intro-like"

export function IntroStepView({ step, flow }: StepComponentProps<IntroStep>) {
  const title = step.title !== undefined ? resolveContentText(flow, step.title) : undefined
  const subtitle = step.subtitle !== undefined ? resolveContentText(flow, step.subtitle) : undefined
  return (
    <div className="fk-step fk-step-intro">
      <IntroLikeView title={title} subtitle={subtitle} image={step.image} livePill={step.livePill} />
    </div>
  )
}
