import type { RadioStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"

export function RadioStepView({ step, value, onChange }: StepComponentProps<RadioStep>) {
  const selected = typeof value === "string" ? value : undefined

  return (
    <div className="fk-step fk-step-radio">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      <div className="fk-list">
        {step.options.map((opt) => {
          const isSelected = selected === opt.value
          return (
            <label
              key={opt.value}
              className={`fk-list-item${isSelected ? " fk-list-item-selected" : ""}`}
            >
              <input
                type="radio"
                className="fk-list-input"
                name={step.id}
                checked={isSelected}
                onChange={() => onChange(opt.value)}
              />
              <span className="fk-list-label">{opt.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
