import type { ProgressComponentProps } from "../progress-registry"

const INDETERMINATE_DOT_COUNT = 3

export function DotsProgress({ currentIndex, total }: ProgressComponentProps) {
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
    <div className="fk-progress-dots" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`fk-progress-dot${i <= currentIndex ? " fk-progress-dot--active" : ""}`} />
      ))}
    </div>
  )
}
