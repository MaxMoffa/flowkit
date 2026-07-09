import type { ConfirmationStep } from "@flowkit/core"
import type { StepComponentProps } from "../types"

export function ConfirmationStepView({ step }: StepComponentProps<ConfirmationStep>) {
  return (
    <div className="fk-step fk-step-confirmation">
      <div className="fk-emoji-xl">{step.emoji ?? "🎉"}</div>
      <h1 className="fk-title">{step.title}</h1>
      {step.message && <p className="fk-subtitle">{step.message}</p>}
    </div>
  )
}
