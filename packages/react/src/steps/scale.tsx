import type { ScaleStep } from "@flowkit/core"
import type { StepComponentProps } from "../types"

export function ScaleStepView({ step, value, onChange }: StepComponentProps<ScaleStep>) {
  const values = Array.from({ length: step.max - step.min + 1 }, (_, i) => step.min + i)
  return (
    <div className="fk-step fk-step-scale">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      <div className="fk-scale-row">
        {values.map((n) => (
          <button
            key={n}
            type="button"
            className={`fk-scale-pill ${value === n ? "fk-scale-pill-selected" : ""}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
      {(step.minLabel || step.maxLabel) && (
        <div className="fk-scale-labels">
          <span>{step.minLabel}</span>
          <span>{step.maxLabel}</span>
        </div>
      )}
    </div>
  )
}
