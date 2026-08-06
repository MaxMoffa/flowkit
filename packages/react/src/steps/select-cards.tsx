import type { SelectCardsStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { useToggleSelection } from "./shared/selection"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"
import { useRemoteOptions } from "./shared/use-remote-options"
import { RemoteLoadMoreButton, RemoteOptionsStatus, RemoteSearchInput } from "./shared/remote-options-ui"
import { useFieldValidation } from "./shared/use-field-validation"
import { FieldError } from "./shared/field-error"

export function SelectCardsStepView({ step, value, onChange, flow, answers, meta, validationAttempt }: StepComponentProps<SelectCardsStep>) {
  const { selected, toggle } = useToggleSelection({ multiple: step.multiple }, value, onChange)
  const remote = useRemoteOptions(step.dataSource, answers)
  // Remote options carry no emoji/description/color (RemoteOption is {value,label} only).
  const options = remote.isRemote ? remote.options.map((opt) => ({ ...opt, emoji: undefined, description: undefined, color: undefined })) : step.options
  const { message, errorId, handleBlur, ariaProps } = useFieldValidation(step, value, flow, answers, meta, validationAttempt)

  return (
    <div className="fk-step fk-step-select-cards">
      <StepTitle image={step.image} title={step.title} />
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      <RemoteSearchInput remote={remote} />
      <RemoteOptionsStatus remote={remote} />
      <div className="fk-cards-grid" onBlur={handleBlur} {...ariaProps}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`fk-card ${selected.includes(opt.value) ? "fk-card-selected" : ""}`}
            onClick={() => toggle(opt.value)}
          >
            {opt.emoji && <span className="fk-emoji">{opt.emoji}</span>}
            {opt.color && (
              <span className="fk-option-swatch" style={{ backgroundColor: opt.color }} aria-hidden="true" />
            )}
            <span className="fk-card-label"><FlowMarkdown text={opt.label} variant="inline" /></span>
            {opt.description && (
              <span className="fk-card-description"><FlowMarkdown text={opt.description} variant="block" /></span>
            )}
          </button>
        ))}
      </div>
      <FieldError id={errorId} message={message} />
      <RemoteLoadMoreButton remote={remote} />
    </div>
  )
}
