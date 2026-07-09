import type { ReviewStep } from "@flowkit/core"
import type { StepComponentProps } from "../types"

function formatAnswer(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "object") {
    const obj = value as { text?: string; photo?: string }
    return [obj.text, obj.photo ? "📷" : undefined].filter(Boolean).join(" ") || "—"
  }
  return String(value)
}

export function ReviewStepView({ step, flow, answers }: StepComponentProps<ReviewStep>) {
  const reviewable = flow.steps.filter(
    (s) => s.type !== "intro" && s.type !== "review" && s.type !== "confirmation",
  )
  return (
    <div className="fk-step fk-step-review">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      <dl className="fk-review-list">
        {reviewable.map((s) => (
          <div key={s.id} className="fk-review-row">
            <dt>{s.title ?? s.id}</dt>
            <dd>{formatAnswer(answers[s.id])}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
