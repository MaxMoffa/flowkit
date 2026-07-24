import type { ReportRow } from "@flowkit-io/core"

/** The `.fk-review-box` recap, shared by the review step and the confirmation step's
 *  print/PDF version. Both render the same rows from the same buildReportRows output. */
export function ReportRows({ rows }: { rows: ReportRow[] }) {
  return (
    <div className="fk-review-box">
      <dl className="fk-review-list">
        {rows.map((row, i) => (
          <div key={i} className="fk-review-row">
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
