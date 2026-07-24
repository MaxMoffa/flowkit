import type { SelectCardsStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { useToggleSelection } from "./shared/selection"

export function SelectCardsStepView({ step, value, onChange }: StepComponentProps<SelectCardsStep>) {
  const { selected, toggle } = useToggleSelection({ multiple: step.multiple }, value, onChange)

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
