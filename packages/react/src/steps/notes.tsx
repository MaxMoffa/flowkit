import type { NotesStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"
import { useFieldValidation } from "./shared/use-field-validation"
import { FieldError } from "./shared/field-error"

export function NotesStepView({ step, value, onChange, flow, answers, meta, validationAttempt }: StepComponentProps<NotesStep>) {
  const current = typeof value === "string" ? value : ""
  const { message, errorId, handleBlur, ariaProps } = useFieldValidation(step, value, flow, answers, meta, validationAttempt)

  return (
    <div className="fk-step fk-step-notes">
      <StepTitle image={step.image} title={step.title} />
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      <textarea
        className="fk-textarea"
        placeholder={step.placeholder ?? "Scrivi qui..."}
        value={current}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        {...ariaProps}
      />
      <FieldError id={errorId} message={message} />
    </div>
  )
}
