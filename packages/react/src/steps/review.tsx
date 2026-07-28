import { buildReportRows } from "@flowkit-io/core"
import type { ReviewStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { ReportRows } from "./shared/report-rows"

export function ReviewStepView({ step, flow, answers, onNavigateToStep }: StepComponentProps<ReviewStep>) {
  return (
    <div className="fk-step fk-step-review">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      {step.meta && <div className="fk-review-meta">{step.meta}</div>}
      <ReportRows rows={buildReportRows(flow, answers)} onRowClick={onNavigateToStep} />
    </div>
  )
}
