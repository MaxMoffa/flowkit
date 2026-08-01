import type { CheckboxStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"
import { useFieldValidation } from "./shared/use-field-validation"
import { FieldError } from "./shared/field-error"

export function CheckboxStepView({ step, value, onChange, flow, answers, meta, validationAttempt }: StepComponentProps<CheckboxStep>) {
  const checked = value === true
  const { message, errorId, handleBlur, ariaProps } = useFieldValidation(step, value, flow, answers, meta, validationAttempt)

  return (
    <div className="fk-step fk-step-checkbox">
      {step.title && <h2 className="fk-title"><FlowMarkdown text={step.title} variant="inline" /></h2>}
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      <label className="fk-checkbox-row">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          onBlur={handleBlur}
          {...ariaProps}
        />
        <span><FlowMarkdown text={step.label} variant="inline" /></span>
      </label>
      {step.description && <p className="fk-checkbox-description"><FlowMarkdown text={step.description} variant="block" /></p>}
      <FieldError id={errorId} message={message} />
    </div>
  )
}
