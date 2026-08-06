import type { ProgressComponentProps } from "../progress-registry"

const INDETERMINATE_DOT_COUNT = 3

type StepState = "completed" | "active" | "upcoming"

function stepState(index: number, currentIndex: number): StepState {
  if (index < currentIndex) return "completed"
  if (index === currentIndex) return "active"
  return "upcoming"
}

/** Numbered top stepper: one circle per step on the resolved path, connected by a line
 *  that fills as the user progresses, with the step's title/subtitle underneath —
 *  bold and in the text color for the active step, greyed out for the rest. Falls back
 *  to the same pulsing-dots indeterminate state as DotsProgress while the path (or its
 *  step list) isn't known yet. */
export function StepsProgress({ currentIndex, total, steps }: ProgressComponentProps) {
  if (total === null || !steps) {
    return (
      <div className="fk-progress-dots fk-progress-indeterminate" role="progressbar">
        {Array.from({ length: INDETERMINATE_DOT_COUNT }, (_, i) => (
          <span key={i} className="fk-progress-dot fk-progress-dot-pulse" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    )
  }

  return (
    <ol
      className="fk-progress-steps"
      role="progressbar"
      aria-valuenow={currentIndex + 1}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      {steps.map((step, i) => {
        const state = stepState(i, currentIndex)
        return (
          <li
            key={i}
            className={`fk-progress-step fk-progress-step--${state}`}
            aria-current={state === "active" ? "step" : undefined}
          >
            <div className="fk-progress-step-track">
              <span className="fk-progress-step-circle" aria-hidden="true">
                {state === "completed" ? "✓" : i + 1}
              </span>
              {i < steps.length - 1 && (
                <span
                  className={`fk-progress-step-line${state === "completed" ? " fk-progress-step-line--filled" : ""}`}
                />
              )}
            </div>
            {(step.title || step.subtitle) && (
              <div className="fk-progress-step-label">
                {step.title && <span className="fk-progress-step-title">{step.title}</span>}
                {step.subtitle && <span className="fk-progress-step-subtitle">{step.subtitle}</span>}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
