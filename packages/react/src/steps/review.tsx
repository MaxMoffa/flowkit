import { buildReportRows } from "@flowkit-io/core"
import type { ReviewStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { ReportRows } from "./shared/report-rows"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"

export function ReviewStepView({
  step,
  flow,
  answers,
  onNavigateToStep,
  visitedStepIds,
}: StepComponentProps<ReviewStep>) {
  return (
    <div className="fk-step fk-step-review">
      <StepTitle image={step.image} title={step.title} />
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      {step.meta && <div className="fk-review-meta">{step.meta}</div>}
      <ReportRows rows={buildReportRows(flow, answers, visitedStepIds)} onRowClick={onNavigateToStep} />
    </div>
  )
}
