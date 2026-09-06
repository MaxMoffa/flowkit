import type { InfoStep } from "@flowkit-io/core"
import { resolveContentText } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { IntroLikeView } from "./shared/intro-like"

/** Content-only step, reusing intro's visual structure (title/subtitle/image) via
 *  IntroLikeView, but with no CTA/livePill: unlike "intro" it isn't pinned to the
 *  first position and can repeat anywhere in the flow. Adds no field to the flow. */
export function InfoStepView({ step, flow }: StepComponentProps<InfoStep>) {
  const title = step.title !== undefined ? resolveContentText(flow, step.title) : undefined
  const subtitle = step.subtitle !== undefined ? resolveContentText(flow, step.subtitle) : undefined
  return (
    <div className="fk-step fk-step-info">
      <IntroLikeView title={title} subtitle={subtitle} image={step.image} />
    </div>
  )
}
