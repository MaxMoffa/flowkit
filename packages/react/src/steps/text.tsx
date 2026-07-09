import type { TextStep } from "@flowkit/core"
import type { StepComponentProps } from "../types"

export function TextStepView({ step, value, onChange }: StepComponentProps<TextStep>) {
  const stringValue = typeof value === "string" ? value : ""

  return (
    <div className="fk-step fk-step-text">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      {step.multiline ? (
        <textarea
          className="fk-textarea"
          placeholder={step.placeholder}
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="fk-input"
          type={step.variant === "number" ? "number" : step.variant === "email" ? "email" : "text"}
          placeholder={step.placeholder}
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}
