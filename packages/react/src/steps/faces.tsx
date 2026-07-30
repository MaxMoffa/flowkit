import { useEffect } from "react"
import type { FacesStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown, stripMarkdownToPlainText } from "../markdown"

export function FacesStepView({ step, value, onChange }: StepComponentProps<FacesStep>) {
  useEffect(() => {
    if (!value) {
      const mid = step.faces[Math.floor(step.faces.length / 2)]
      if (mid) onChange(mid.value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fk-step fk-step-faces">
      {step.title && <h2 className="fk-title"><FlowMarkdown text={step.title} variant="inline" /></h2>}
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      <div className="fk-faces-row">
        {step.faces.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`fk-face ${value === f.value ? "fk-face-selected" : ""}`}
            onClick={() => onChange(f.value)}
            aria-label={f.label ? stripMarkdownToPlainText(f.label) : f.value}
          >
            <span className="fk-emoji-lg">{f.emoji}</span>
            {f.label && (
              <span className="fk-face-label"><FlowMarkdown text={f.label} variant="inline" /></span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
