import type { NotesStep } from "@flowkit/core"
import type { StepComponentProps } from "../types"

export function NotesStepView({ step, value, onChange }: StepComponentProps<NotesStep>) {
  const current = typeof value === "string" ? value : ""

  return (
    <div className="fk-step fk-step-notes">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      <textarea
        className="fk-textarea"
        placeholder={step.placeholder ?? "Scrivi qui..."}
        value={current}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
