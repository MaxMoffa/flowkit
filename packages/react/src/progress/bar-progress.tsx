import type { ProgressComponentProps } from "../progress-registry"

export function BarProgress({ pct }: ProgressComponentProps) {
  return (
    <div className="fk-progress-track" role="progressbar" aria-valuenow={pct}>
      <div className="fk-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}
