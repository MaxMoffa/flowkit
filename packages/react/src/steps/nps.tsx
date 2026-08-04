import type { NpsStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"
import { useFieldValidation } from "./shared/use-field-validation"
import { FieldError } from "./shared/field-error"

export function NpsStepView({ step, value, onChange, flow, answers, meta, validationAttempt }: StepComponentProps<NpsStep>) {
  const values = Array.from({ length: 11 }, (_, i) => i)
  const { message, errorId, handleBlur, ariaProps } = useFieldValidation(step, value, flow, answers, meta, validationAttempt)
  return (
    <div className="fk-step fk-step-nps">
      <StepTitle image={step.image} title={step.title} />
      <p className="fk-subtitle">
        <FlowMarkdown
          text={step.question ?? "Quanto è probabile che ci consiglieresti a un amico?"}
          variant="block"
        />
      </p>
      <div className="fk-nps-row" onBlur={handleBlur} {...ariaProps}>
        {values.map((n) => (
          <button
            key={n}
            type="button"
            className={`fk-nps-cell ${value === n ? "fk-nps-cell-selected" : ""}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="fk-nps-labels">
        <span>Per niente probabile</span>
        <span>Molto probabile</span>
      </div>
      <FieldError id={errorId} message={message} />
    </div>
  )
}
