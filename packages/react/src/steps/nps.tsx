import type { NpsStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"

export function NpsStepView({ step, value, onChange }: StepComponentProps<NpsStep>) {
  const values = Array.from({ length: 11 }, (_, i) => i)
  return (
    <div className="fk-step fk-step-nps">
      {step.title && <h2 className="fk-title"><FlowMarkdown text={step.title} variant="inline" /></h2>}
      <p className="fk-subtitle">
        <FlowMarkdown
          text={step.question ?? "Quanto è probabile che ci consiglieresti a un amico?"}
          variant="block"
        />
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
