import type { MultiSelectStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { OptionList } from "./shared/option-list"
import { useToggleSelection } from "./shared/selection"
import { FlowMarkdown } from "../markdown"
import { useRemoteOptions } from "./shared/use-remote-options"
import { RemoteLoadMoreButton, RemoteOptionsStatus, RemoteSearchInput } from "./shared/remote-options-ui"
import { useFieldValidation } from "./shared/use-field-validation"
import { FieldError } from "./shared/field-error"

export function MultiSelectStepView({ step, value, onChange, flow, answers, meta, validationAttempt }: StepComponentProps<MultiSelectStep>) {
  const { selected, toggle, maxReached } = useToggleSelection(
    { multiple: true, max: step.max },
    value,
    onChange,
  )
  const remote = useRemoteOptions(step.dataSource, answers)
  const options = remote.isRemote ? remote.options : step.options
  const { message, errorId, handleBlur, ariaProps } = useFieldValidation(step, value, flow, answers, meta, validationAttempt)

  return (
    <div className="fk-step fk-step-multi-select">
      {step.title && <h2 className="fk-title"><FlowMarkdown text={step.title} variant="inline" /></h2>}
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      <RemoteSearchInput remote={remote} />
      <RemoteOptionsStatus remote={remote} />
      <div onBlur={handleBlur} {...ariaProps}>
        <OptionList
          options={options}
          inputType="checkbox"
          isSelected={(v) => selected.includes(v)}
          onPick={toggle}
          isDisabled={(v) => maxReached && !selected.includes(v)}
        />
      </div>
      <FieldError id={errorId} message={message} />
      <RemoteLoadMoreButton remote={remote} />
    </div>
  )
}
