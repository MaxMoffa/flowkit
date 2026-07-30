import type { NotesStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"

export function NotesStepView({ step, value, onChange }: StepComponentProps<NotesStep>) {
  const current = typeof value === "string" ? value : ""

  return (
    <div className="fk-step fk-step-notes">
      {step.title && <h2 className="fk-title"><FlowMarkdown text={step.title} variant="inline" /></h2>}
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      <textarea
        className="fk-textarea"
        placeholder={step.placeholder ?? "Scrivi qui..."}
        value={current}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
