import type { ReportRow } from "@flowkit-io/core"

/** The `.fk-review-box` recap, shared by the review step and the confirmation step's
 *  print/PDF version. Both render the same rows from the same buildReportRows output.
 *  `onRowClick` is optional and left undefined by the two inert consumers (print/PDF
 *  recap, raw-HTML export), which keeps their markup byte-for-byte unchanged. */
export function ReportRows({ rows, onRowClick }: { rows: ReportRow[]; onRowClick?: (stepId: string) => void }) {
  return (
    <div className="fk-review-box">
      <dl className="fk-review-list">
        {rows.map((row) => (
          <div
            key={row.stepId}
            className={onRowClick ? "fk-review-row fk-review-row-clickable" : "fk-review-row"}
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={onRowClick ? () => onRowClick(row.stepId) : undefined}
            onKeyDown={
              onRowClick
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onRowClick(row.stepId)
                    }
                  }
                : undefined
            }
          >
            <span className="fk-review-icon">{row.icon}</span>
            <div>
              <dt>{row.title}</dt>
              <dd>{row.value}</dd>
              {row.media && row.media.length > 0 && (
                <div className="fk-review-media">
                  {row.media.map((item) => (
                    <img key={item.id} src={item.dataUrl} alt="" />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </dl>
    </div>
  )
}
