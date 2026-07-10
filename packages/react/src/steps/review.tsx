import type { ReviewStep, Step } from "@flowkit/core"
import type { StepComponentProps } from "../types"

function optionLabel(step: Step, rawValue: string): string {
  if (step.type === "select-cards" || step.type === "chips" || step.type === "multi-select") {
    return step.options.find((o) => o.value === rawValue)?.label ?? rawValue
  }
  if (step.type === "faces") {
    return step.faces.find((f) => f.value === rawValue)?.label ?? step.faces.find((f) => f.value === rawValue)?.emoji ?? rawValue
  }
  return rawValue
}

function formatAnswer(step: Step, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"
  if (Array.isArray(value)) return value.map((v) => optionLabel(step, String(v))).join(", ")
  if ((step.type as string) === "group") {
    const children = (step as unknown as { steps: Step[] }).steps
    const answers = value as Record<string, unknown>
    return (
      children
        .map((child) => formatAnswer(child, answers[child.id]))
        .filter((v) => v && v !== "—")
        .join(", ") || "—"
    )
  }
  if (step.type === "photo") return value ? "📷" : "—"
  if (typeof value === "object") return "—"
  return optionLabel(step, String(value))
}

function defaultIcon(step: Step): string {
  if (step.icon) return step.icon
  switch (step.type as string) {
    case "location":
      return "📍"
    case "select-cards":
      return "🏷️"
    case "scale":
      return "📊"
    case "chips":
      return "⏱️"
    case "faces":
      return "🙂"
    case "notes":
    case "photo":
    case "group":
      return "📝"
    default:
      return "•"
  }
}

export function ReviewStepView({ step, flow, answers }: StepComponentProps<ReviewStep>) {
  const reviewable = flow.steps.filter(
    (s) => s.type !== "intro" && s.type !== "review" && s.type !== "confirmation",
  )
  return (
    <div className="fk-step fk-step-review">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      {step.meta && <div className="fk-review-meta">{step.meta}</div>}
      <div className="fk-review-box">
        <dl className="fk-review-list">
          {reviewable.map((s) => (
            <div key={s.id} className="fk-review-row">
              <span className="fk-review-icon">{defaultIcon(s)}</span>
              <div>
                <dt>{s.title ?? s.id}</dt>
                <dd>{formatAnswer(s, answers[s.id])}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
