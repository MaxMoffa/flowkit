import { buildReportRows, formatMoney, getPendingPayment, resolveText } from "@flowkit-io/core"
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
  // A final review step that sits in front of a collected payment shows the amount
  // up front: the submit button is what actually charges, so the user has to see
  // what they're about to pay before pressing it.
  const pendingPayment =
    step.mode !== "checkpoint" && step.paymentSummary !== "hidden" ? getPendingPayment(flow, answers) : null

  return (
    <div className="fk-step fk-step-review">
      <StepTitle image={step.image} title={step.title} />
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      {pendingPayment && (
        <div className="fk-review-total">
          <span className="fk-review-total-label">{resolveText(flow, "paymentTotal")}</span>
          <span className="fk-review-total-amount">
            {formatMoney(pendingPayment.amount, pendingPayment.currency, flow.locale)}
          </span>
        </div>
      )}
      {step.meta && <div className="fk-review-meta">{step.meta}</div>}
      <ReportRows rows={buildReportRows(flow, answers, visitedStepIds)} onRowClick={onNavigateToStep} />
    </div>
  )
}
