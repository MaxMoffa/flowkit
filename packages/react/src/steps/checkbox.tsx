import type { CheckboxStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"

export function CheckboxStepView({ step, value, onChange }: StepComponentProps<CheckboxStep>) {
  const checked = value === true

  return (
    <div className="fk-step fk-step-checkbox">
      {step.title && <h2 className="fk-title"><FlowMarkdown text={step.title} variant="inline" /></h2>}
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      <label className="fk-checkbox-row">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span><FlowMarkdown text={step.label} variant="inline" /></span>
      </label>
      {step.description && <p className="fk-checkbox-description"><FlowMarkdown text={step.description} variant="block" /></p>}
    </div>
  )
}
