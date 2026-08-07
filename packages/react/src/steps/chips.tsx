import type { ChipsStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { optionColorClass, optionColorStyle } from "./shared/option-color"
import { useToggleSelection } from "./shared/selection"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"
import { useRemoteOptions } from "./shared/use-remote-options"
import { RemoteLoadMoreButton, RemoteOptionsStatus, RemoteSearchInput } from "./shared/remote-options-ui"
import { useFieldValidation } from "./shared/use-field-validation"
import { FieldError } from "./shared/field-error"

export function ChipsStepView({ step, value, onChange, flow, answers, meta, validationAttempt }: StepComponentProps<ChipsStep>) {
  const { selected, toggle } = useToggleSelection({ multiple: step.multiple }, value, onChange)
  const remote = useRemoteOptions(step.dataSource, answers)
  // Remote options carry no description/color (RemoteOption is {value,label} only).
  const options = remote.isRemote
    ? remote.options.map((opt) => ({ ...opt, description: undefined, color: undefined }))
    : step.options
  const { message, errorId, handleBlur, ariaProps } = useFieldValidation(step, value, flow, answers, meta, validationAttempt)

  return (
    <div className="fk-step fk-step-chips">
      <StepTitle image={step.image} title={step.title} />
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      <RemoteSearchInput remote={remote} />
      <RemoteOptionsStatus remote={remote} />
      <div className="fk-chips-wrap" onBlur={handleBlur} {...ariaProps}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`fk-chip ${selected.includes(opt.value) ? "fk-chip-selected" : ""}${opt.description ? " fk-chip-with-description" : ""} ${optionColorClass(opt.color)}`}
            style={optionColorStyle(opt.color)}
            onClick={() => toggle(opt.value)}
          >
            <FlowMarkdown text={opt.label} variant="inline" />
            {opt.description && (
              <span className="fk-chip-description"><FlowMarkdown text={opt.description} variant="block" /></span>
            )}
          </button>
        ))}
      </div>
      <FieldError id={errorId} message={message} />
      <RemoteLoadMoreButton remote={remote} />
    </div>
  )
}
