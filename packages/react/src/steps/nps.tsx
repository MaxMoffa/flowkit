import type { NpsStep } from "@flowkit/core"
import type { StepComponentProps } from "../types"

export function NpsStepView({ step, value, onChange }: StepComponentProps<NpsStep>) {
  const values = Array.from({ length: 11 }, (_, i) => i)
  return (
    <div className="fk-step fk-step-nps">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      <p className="fk-subtitle">
        {step.question ?? "Quanto è probabile che ci consiglieresti a un amico?"}
      </p>
      <div className="fk-nps-row">
        {values.map((n) => (
          <button
            key={n}
            type="button"
            className={`fk-nps-cell ${value === n ? "fk-nps-cell-selected" : ""}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="fk-nps-labels">
        <span>Per niente probabile</span>
        <span>Molto probabile</span>
      </div>
    </div>
  )
}
