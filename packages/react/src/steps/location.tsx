import type { LocationStep } from "@flowkit/core"
import type { StepComponentProps } from "../types"

export function LocationStepView({ step, value, onChange }: StepComponentProps<LocationStep>) {
  return (
    <div className="fk-step fk-step-location">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      <input
        className="fk-input"
        type="text"
        placeholder={step.placeholder ?? "Cerca un indirizzo"}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
