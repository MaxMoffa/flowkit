import type { FacesStep } from "@flowkit/core"
import type { StepComponentProps } from "../types"

export function FacesStepView({ step, value, onChange }: StepComponentProps<FacesStep>) {
  return (
    <div className="fk-step fk-step-faces">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      <div className="fk-faces-row">
        {step.faces.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`fk-face ${value === f.value ? "fk-face-selected" : ""}`}
            onClick={() => onChange(f.value)}
            aria-label={f.label ?? f.value}
          >
            <span className="fk-emoji-lg">{f.emoji}</span>
            {f.label && <span className="fk-face-label">{f.label}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
