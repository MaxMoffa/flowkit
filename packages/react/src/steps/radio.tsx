import type { RadioStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { OptionList } from "./shared/option-list"
import { FlowMarkdown } from "../markdown"

export function RadioStepView({ step, value, onChange }: StepComponentProps<RadioStep>) {
  const selected = typeof value === "string" ? value : undefined

  return (
    <div className="fk-step fk-step-radio">
      {step.title && <h2 className="fk-title"><FlowMarkdown text={step.title} variant="inline" /></h2>}
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
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
