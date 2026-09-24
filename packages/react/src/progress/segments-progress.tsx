import type { ProgressComponentProps } from "../progress-registry"

const INDETERMINATE_DOT_COUNT = 3

/**
 * Segmented bar: one thin pill per step on the resolved path, filled solid for the ones
 * already done. The active step's segment grows to carry its number, plain segments
 * otherwise — a shorter, number-free-by-default alternative to the numbered circle
 * stepper (`StepsProgress`): no per-step titles, no dedicated current-step row, so the
 * header never grows past the height of this one row regardless of the flow's length.
 *
 * Unlike the circle stepper, this never collapses long paths into a "…" run: a thin
 * segment scales down fine at any count, which is the point of the metaphor.
 *
 * Falls back to the same pulsing-dots indeterminate state as DotsProgress/StepsProgress
 * while the path isn't known yet.
 */
export function SegmentsProgress({ currentIndex, total }: ProgressComponentProps) {
  if (total === null) {
    return (
      <div className="fk-progress-dots fk-progress-indeterminate" role="progressbar">
        {Array.from({ length: INDETERMINATE_DOT_COUNT }, (_, i) => (
          <span key={i} className="fk-progress-dot fk-progress-dot-pulse" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    )
  }

  return (
    <div
      className="fk-progress-segments"
      role="progressbar"
      aria-valuenow={currentIndex + 1}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      {Array.from({ length: total }, (_, i) => {
        if (i === currentIndex) {
          return (
            <span key={i} className="fk-progress-segment fk-progress-segment--active" aria-current="step">
              {i + 1}
            </span>
          )
        }
        return (
          <span
            key={i}
            className={`fk-progress-segment${i < currentIndex ? " fk-progress-segment--completed" : ""}`}
            aria-hidden="true"
          />
        )
      })}
    </div>
  )
}
