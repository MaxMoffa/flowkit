import type { IntroStep } from "@flowkit/core"
import type { StepComponentProps } from "../types"

export function IntroStepView({ step }: StepComponentProps<IntroStep>) {
  return (
    <div className="fk-step fk-step-intro">
      {step.livePill && (
        <div className="fk-intro-pill">
          <span className="fk-live-dot" />
          {step.livePill}
        </div>
      )}
      {step.emoji && <div className="fk-intro-badge">{step.emoji}</div>}
      {step.title && <h1 className="fk-title">{step.title}</h1>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
    </div>
  )
}
