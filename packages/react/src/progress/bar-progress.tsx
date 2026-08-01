import type { ProgressComponentProps } from "../progress-registry"

export function BarProgress({ pct }: ProgressComponentProps) {
  const indeterminate = pct === null
  return (
    <div
      className={`fk-progress-track${indeterminate ? " fk-progress-indeterminate" : ""}`}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : pct}
    >
      <div className="fk-progress-fill" style={indeterminate ? undefined : { width: `${pct}%` }} />
    </div>
  )
}
