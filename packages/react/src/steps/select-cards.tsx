import type { SelectCardsStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { useToggleSelection } from "./shared/selection"
import { FlowMarkdown } from "../markdown"

export function SelectCardsStepView({ step, value, onChange }: StepComponentProps<SelectCardsStep>) {
  const { selected, toggle } = useToggleSelection({ multiple: step.multiple }, value, onChange)

  return (
    <div className="fk-step fk-step-select-cards">
      {step.title && <h2 className="fk-title"><FlowMarkdown text={step.title} variant="inline" /></h2>}
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      <div className="fk-cards-grid">
        {step.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`fk-card ${selected.includes(opt.value) ? "fk-card-selected" : ""}`}
            onClick={() => toggle(opt.value)}
          >
            {opt.emoji && <span className="fk-emoji">{opt.emoji}</span>}
            <span className="fk-card-label"><FlowMarkdown text={opt.label} variant="inline" /></span>
            {opt.description && (
              <span className="fk-card-description"><FlowMarkdown text={opt.description} variant="block" /></span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
