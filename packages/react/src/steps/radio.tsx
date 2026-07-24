import type { RadioStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { OptionList } from "./shared/option-list"

export function RadioStepView({ step, value, onChange }: StepComponentProps<RadioStep>) {
  const selected = typeof value === "string" ? value : undefined

  return (
    <div className="fk-step fk-step-radio">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      <OptionList
        options={step.options}
        inputType="radio"
        name={step.id}
        isSelected={(v) => selected === v}
        onPick={onChange}
      />
    </div>
  )
}
