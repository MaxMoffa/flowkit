import type { SelectCardsStep } from "@flowkit/core"
import type { StepComponentProps } from "../types"

export function SelectCardsStepView({ step, value, onChange }: StepComponentProps<SelectCardsStep>) {
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
    <div className="fk-step fk-step-select-cards">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      <div className="fk-cards-grid">
        {step.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`fk-card ${selected.includes(opt.value) ? "fk-card-selected" : ""}`}
            onClick={() => toggle(opt.value)}
          >
            {opt.emoji && <span className="fk-emoji">{opt.emoji}</span>}
            <span className="fk-card-label">{opt.label}</span>
            {opt.description && <span className="fk-card-description">{opt.description}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
