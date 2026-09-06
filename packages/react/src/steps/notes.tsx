import type { NotesStep } from "@flowkit-io/core"
import { resolveContentText } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"
import { useFieldValidation } from "./shared/use-field-validation"
import { FieldError } from "./shared/field-error"

export function NotesStepView({ step, value, onChange, flow, answers, meta, validationAttempt }: StepComponentProps<NotesStep>) {
  const current = typeof value === "string" ? value : ""
  const { message, errorId, handleBlur, ariaProps } = useFieldValidation(step, value, flow, answers, meta, validationAttempt)
  const title = step.title !== undefined ? resolveContentText(flow, step.title) : undefined
  const subtitle = step.subtitle !== undefined ? resolveContentText(flow, step.subtitle) : undefined

  return (
    <div className="fk-step fk-step-notes">
      <StepTitle image={step.image} title={title} />
      {subtitle && <p className="fk-subtitle"><FlowMarkdown text={subtitle} variant="block" /></p>}
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
