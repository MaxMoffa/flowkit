import type { ProgressComponentProps } from "../progress-registry"

export function DotsProgress({ currentIndex, total }: ProgressComponentProps) {
  return (
    <div className="fk-progress-dots" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`fk-progress-dot${i <= currentIndex ? " fk-progress-dot--active" : ""}`} />
      ))}
    </div>
  )
}
