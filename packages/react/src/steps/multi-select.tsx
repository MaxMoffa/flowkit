import type { MultiSelectStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { OptionList } from "./shared/option-list"
import { useToggleSelection } from "./shared/selection"

export function MultiSelectStepView({ step, value, onChange }: StepComponentProps<MultiSelectStep>) {
  const { selected, toggle, maxReached } = useToggleSelection(
    { multiple: true, max: step.max },
    value,
    onChange,
  )

  return (
    <div className="fk-step fk-step-multi-select">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      <OptionList
        options={step.options}
        inputType="checkbox"
        isSelected={(v) => selected.includes(v)}
        onPick={toggle}
        isDisabled={(v) => maxReached && !selected.includes(v)}
      />
    </div>
  )
}
