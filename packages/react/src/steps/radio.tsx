import { useState } from "react"
import { resolveText, resolveContentText, type RadioStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { OptionList } from "./shared/option-list"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"
import { useRemoteOptions } from "./shared/use-remote-options"
import { RemoteLoadMoreButton, RemoteOptionsStatus, RemoteSearchInput } from "./shared/remote-options-ui"
import { useFieldValidation } from "./shared/use-field-validation"
import { FieldError } from "./shared/field-error"

export function RadioStepView({ step, value, onChange, flow, answers, meta, validationAttempt }: StepComponentProps<RadioStep>) {
  const remote = useRemoteOptions(step.dataSource, answers)
  const rawOptions = remote.isRemote ? remote.options : step.options
  const options = rawOptions.map((opt) => ({
    ...opt,
    label: resolveContentText(flow, opt.label),
    description: "description" in opt && opt.description !== undefined ? resolveContentText(flow, opt.description) : undefined,
  }))
  const { message, errorId, handleBlur, ariaProps } = useFieldValidation(step, value, flow, answers, meta, validationAttempt)

  const optionValues = new Set(options.map((o) => o.value))
  const currentValue = typeof value === "string" ? value : ""
  const valueIsOther = currentValue.length > 0 && !optionValues.has(currentValue)
  const [otherToggled, setOtherToggled] = useState(valueIsOther)
  const otherOn = step.otherOption != null && (otherToggled || valueIsOther)
  const selected = otherOn ? undefined : currentValue || undefined
  const title = step.title !== undefined ? resolveContentText(flow, step.title) : undefined
  const subtitle = step.subtitle !== undefined ? resolveContentText(flow, step.subtitle) : undefined

  return (
    <div className="fk-step fk-step-radio">
      <StepTitle image={step.image} title={title} />
      {subtitle && <p className="fk-subtitle"><FlowMarkdown text={subtitle} variant="block" /></p>}
      <RemoteSearchInput remote={remote} />
      <RemoteOptionsStatus remote={remote} />
      <div onBlur={handleBlur} {...ariaProps}>
        <OptionList
          options={options}
          inputType="radio"
          name={step.id}
          isSelected={(v) => selected === v}
          onPick={(v) => {
            setOtherToggled(false)
            onChange(v)
          }}
          other={
            step.otherOption
              ? {
                  active: otherOn,
                  label: step.otherOption.label ?? resolveText(flow, "otherOption"),
                  placeholder: step.otherOption.placeholder ?? resolveText(flow, "otherOptionPlaceholder"),
                  text: otherOn ? currentValue : "",
                  onToggle: () => {
                    setOtherToggled(true)
                    if (!valueIsOther) onChange("")
                  },
                  onText: (text) => {
                    setOtherToggled(true)
                    onChange(text)
                  },
                }
              : undefined
          }
        />
      </div>
      <FieldError id={errorId} message={message} />
      <RemoteLoadMoreButton remote={remote} />
    </div>
  )
}
