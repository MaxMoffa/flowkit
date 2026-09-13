import type { CSSProperties } from "react"
import type { ProgressComponentProps } from "../progress-registry"

export function BarProgress({ pct, segments }: ProgressComponentProps) {
  const indeterminate = pct === null

  if (indeterminate || !segments || segments.length <= 1) {
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

  return (
    <div className="fk-progress-track fk-progress-segmented" role="progressbar" aria-valuenow={pct}>
      {segments.map((segment, i) => (
        <div
          key={i}
          className="fk-progress-segment"
          style={{ flexGrow: segment.length, "--fk-segment-color": segment.color } as CSSProperties}
        >
          <div
            className="fk-progress-segment-fill"
            style={{ width: `${(segment.filledLength / segment.length) * 100}%` }}
          />
        </div>
      ))}
    </div>
  )
}
