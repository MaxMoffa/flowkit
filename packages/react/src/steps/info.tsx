import type { InfoStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { IntroLikeView } from "./shared/intro-like"

/** Content-only step, reusing intro's visual structure (title/subtitle/image) via
 *  IntroLikeView, but with no CTA/livePill: unlike "intro" it isn't pinned to the
 *  first position and can repeat anywhere in the flow. Adds no field to the flow. */
export function InfoStepView({ step }: StepComponentProps<InfoStep>) {
  return (
    <div className="fk-step fk-step-info">
      <IntroLikeView title={step.title} subtitle={step.subtitle} image={step.image} />
    </div>
  )
}
