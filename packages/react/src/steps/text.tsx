import type { TextStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"
import { useSmartFill } from "./shared/use-smart-fill"
import { useFieldValidation } from "./shared/use-field-validation"
import { FieldError } from "./shared/field-error"

export function TextStepView({
  step,
  value,
  onChange,
  flow,
  answers,
  meta,
  onMetaChange,
  validationAttempt,
}: StepComponentProps<TextStep>) {
  const stringValue = typeof value === "string" ? value : ""
  const smartFill = useSmartFill(step, stringValue, onChange, answers, meta, onMetaChange)
  const { message, errorId, handleBlur, ariaProps } = useFieldValidation(step, value, flow, answers, meta, validationAttempt)

  return (
    <div className="fk-step fk-step-text">
      {step.title && <h2 className="fk-title"><FlowMarkdown text={step.title} variant="inline" /></h2>}
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      {step.multiline ? (
        <textarea
          className="fk-textarea"
          placeholder={step.placeholder}
          value={stringValue}
          onChange={(e) => smartFill.handleChange(e.target.value)}
          onBlur={handleBlur}
          {...ariaProps}
        />
      ) : (
        <input
          className="fk-input"
          type={step.variant === "number" ? "number" : step.variant === "email" ? "email" : "text"}
          placeholder={step.placeholder}
          value={stringValue}
          onChange={(e) => smartFill.handleChange(e.target.value)}
          onBlur={handleBlur}
          {...ariaProps}
        />
      )}
      <FieldError id={errorId} message={message} />
      {smartFill.isSuggested && <p className="fk-smartfill-hint">✨ Suggerito, puoi modificarlo</p>}
    </div>
  )
}
