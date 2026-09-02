import { useState } from "react"
import { resolveText, type MultiSelectStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { OptionList } from "./shared/option-list"
import { useToggleSelection } from "./shared/selection"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"
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

  const optionValues = new Set(options.map((o) => o.value))
  const realSelected = selected.filter((v) => optionValues.has(v))
  const freeValue = selected.find((v) => !optionValues.has(v)) ?? ""
  // Free text lives in local state so the input stays stable even if it happens to
  // collide with an option value (which would otherwise disappear from `selected`).
  const [otherText, setOtherText] = useState(freeValue)
  const [otherToggled, setOtherToggled] = useState(freeValue !== "")
  const otherOn = step.otherOption != null && (otherToggled || freeValue !== "")

  return (
    <div className="fk-step fk-step-multi-select">
      <StepTitle image={step.image} title={step.title} />
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
          other={
            step.otherOption
              ? {
                  active: otherOn,
                  label: step.otherOption.label ?? resolveText(flow, "otherOption"),
                  placeholder: step.otherOption.placeholder ?? resolveText(flow, "otherOptionPlaceholder"),
                  text: otherText,
                  onToggle: () => {
                    if (otherOn) {
                      setOtherToggled(false)
                      setOtherText("")
                      onChange(realSelected)
                    } else {
                      setOtherToggled(true)
                    }
                  },
                  onText: (text) => {
                    setOtherText(text)
                    setOtherToggled(true)
                    onChange(text ? [...realSelected, text] : realSelected)
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
