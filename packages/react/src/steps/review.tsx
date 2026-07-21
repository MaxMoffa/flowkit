import { buildReportRows } from "@flowkit-io/core"
import type { ReviewStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"

export function ReviewStepView({ step, flow, answers }: StepComponentProps<ReviewStep>) {
  const rows = buildReportRows(flow, answers)
  return (
    <div className="fk-step fk-step-review">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      {step.meta && <div className="fk-review-meta">{step.meta}</div>}
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
    </div>
  )
}
