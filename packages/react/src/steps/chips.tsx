import type { ChipsStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"

export function ChipsStepView({ step, value, onChange }: StepComponentProps<ChipsStep>) {
  const selected = step.multiple
    ? Array.isArray(value)
      ? value
      : []
    : typeof value === "string"
      ? [value]
      : []

  function toggle(optionValue: string) {
    if (step.multiple) {
      const next = selected.includes(optionValue)
        ? selected.filter((v) => v !== optionValue)
        : [...selected, optionValue]
      onChange(next)
    } else {
      onChange(optionValue)
    }
  }

  return (
    <div className="fk-step fk-step-chips">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      <div className="fk-chips-wrap">
        {step.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`fk-chip ${selected.includes(opt.value) ? "fk-chip-selected" : ""}`}
            onClick={() => toggle(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
