import type { CheckboxStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"

export function CheckboxStepView({ step, value, onChange }: StepComponentProps<CheckboxStep>) {
  const checked = value === true

  return (
    <div className="fk-step fk-step-checkbox">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      <label className="fk-checkbox-row">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{step.label}</span>
      </label>
      {step.description && <p className="fk-checkbox-description">{step.description}</p>}
    </div>
  )
}
