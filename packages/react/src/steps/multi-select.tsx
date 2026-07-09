import type { MultiSelectStep } from "@flowkit/core"
import type { StepComponentProps } from "../types"

export function MultiSelectStepView({ step, value, onChange }: StepComponentProps<MultiSelectStep>) {
  const selected = Array.isArray(value) ? value : []

  function toggle(optionValue: string) {
    const isSelected = selected.includes(optionValue)
    if (isSelected) {
      onChange(selected.filter((v) => v !== optionValue))
      return
    }
    if (step.max !== undefined && selected.length >= step.max) return
    onChange([...selected, optionValue])
  }

  return (
    <div className="fk-step fk-step-multi-select">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      <div className="fk-list">
        {step.options.map((opt) => (
          <label key={opt.value} className="fk-list-item">
            <input
              type="checkbox"
              checked={selected.includes(opt.value)}
              onChange={() => toggle(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
