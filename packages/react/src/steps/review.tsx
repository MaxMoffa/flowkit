import { buildReportRows } from "@flowkit-io/core"
import type { ReviewStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { ReportRows } from "./shared/report-rows"
import { FlowMarkdown } from "../markdown"

export function ReviewStepView({ step, flow, answers, onNavigateToStep }: StepComponentProps<ReviewStep>) {
  return (
    <div className="fk-step fk-step-review">
      {step.title && <h2 className="fk-title"><FlowMarkdown text={step.title} variant="inline" /></h2>}
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      {step.meta && <div className="fk-review-meta">{step.meta}</div>}
      <ReportRows rows={buildReportRows(flow, answers)} onRowClick={onNavigateToStep} />
    </div>
  )
}
