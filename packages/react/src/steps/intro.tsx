import type { IntroStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"

export function IntroStepView({ step }: StepComponentProps<IntroStep>) {
  return (
    <div className="fk-step fk-step-intro">
      {step.livePill && (
        <div className="fk-intro-pill">
          <span className="fk-live-dot" />
          <FlowMarkdown text={step.livePill} variant="inline" />
        </div>
      )}
      {step.emoji && <div className="fk-intro-badge">{step.emoji}</div>}
      {step.title && <h1 className="fk-title"><FlowMarkdown text={step.title} variant="inline" /></h1>}
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
    </div>
  )
}
