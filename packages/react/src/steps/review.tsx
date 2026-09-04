import {
  buildOrderSummary,
  buildReportRows,
  formatMoney,
  getPendingPayment,
  resolveText,
} from "@flowkit-io/core"
import type { CalculateTax, Flow, OrderSummary, ReviewStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { ReportRows } from "./shared/report-rows"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"
import { useTaxCalculation, type TaxState } from "./shared/use-tax-calculation"

function OrderSummaryTable({
  summary,
  tax,
  locale,
  flow,
  totalLabel,
}: {
  summary: OrderSummary
  tax: TaxState
  locale: string
  flow: Flow
  totalLabel: string
}) {
  const taxResult = tax.status === "done" ? tax.result : null
  const grandTotal = taxResult ? taxResult.totalWithTax : summary.total

  return (
    <div className="fk-order-summary">
      <ul className="fk-order-summary-lines">
        {summary.lines.map((line, index) => (
          <li key={`${line.stepId}-${line.value}-${index}`} className="fk-order-summary-line">
            <span className="fk-order-summary-line-label">
              {line.quantity > 1 && <span className="fk-order-summary-qty">{line.quantity}×</span>}
              <FlowMarkdown text={line.label} variant="inline" />
              {line.kind === "item" && line.quantity > 1 && (
                <span className="fk-order-summary-unit">
                  {formatMoney(line.unitAmount, summary.currency, locale)} / cad.
                </span>
              )}
            </span>
            <span className="fk-order-summary-line-amount">
              {formatMoney(line.amount, summary.currency, locale)}
            </span>
          </li>
        ))}

        {taxResult && (
          <li className="fk-order-summary-line fk-order-summary-subtotal">
            <span className="fk-order-summary-line-label">{resolveText(flow, "orderSubtotal")}</span>
            <span className="fk-order-summary-line-amount">
              {formatMoney(summary.total, summary.currency, locale)}
            </span>
          </li>
        )}
        {taxResult && tax.status === "done" && tax.addressSource === "estimated" && (
          <li className="fk-order-summary-line fk-order-summary-tax-note">
            <span className="fk-order-summary-line-label">
              {resolveText(flow, "taxLabel")} · {resolveText(flow, "taxEstimated")}
            </span>
          </li>
        )}
        {taxResult &&
          (taxResult.breakdown.length > 0
            ? taxResult.breakdown.map((entry, index) => (
                <li key={`tax-${index}`} className="fk-order-summary-line fk-order-summary-tax">
                  <span className="fk-order-summary-line-label">{entry.label}</span>
                  <span className="fk-order-summary-line-amount">
                    {formatMoney(entry.amount, taxResult.currency, locale)}
                  </span>
                </li>
              ))
            : (
                <li className="fk-order-summary-line fk-order-summary-tax">
                  <span className="fk-order-summary-line-label">{resolveText(flow, "taxLabel")}</span>
                  <span className="fk-order-summary-line-amount">
                    {formatMoney(taxResult.taxAmount, taxResult.currency, locale)}
                  </span>
                </li>
              ))}

        {tax.status === "loading" && (
          <li className="fk-order-summary-line fk-order-summary-tax">
            <span className="fk-order-summary-line-label">{resolveText(flow, "taxCalculating")}</span>
            <span className="fk-order-summary-line-amount">…</span>
          </li>
        )}
        {tax.status === "error" && (
          <li className="fk-order-summary-line fk-order-summary-tax">
            <span className="fk-order-summary-line-label fk-order-summary-tax-error">
              {resolveText(flow, "taxError")}
            </span>
          </li>
        )}
      </ul>

      <div className="fk-order-summary-total">
        <span>{totalLabel}</span>
        <span className="fk-order-summary-total-amount">
          {formatMoney(grandTotal, summary.currency, locale)}
        </span>
      </div>
    </div>
  )
}

export function ReviewStepView({
  step,
  flow,
  answers,
  onNavigateToStep,
  visitedStepIds,
  estimatedAddress,
}: StepComponentProps<ReviewStep>) {
  const showPaymentRecap = step.mode !== "checkpoint" && step.paymentSummary !== "hidden"

  const orderSummary = showPaymentRecap ? buildOrderSummary(flow, answers) : null
  const pendingPayment = showPaymentRecap && !orderSummary ? getPendingPayment(flow, answers) : null

  const paymentStep = flow.steps.find((s) => s.type === "payment-stripe") as
    | { calculateTax?: CalculateTax; taxBehavior?: "inclusive" | "exclusive" }
    | undefined
  // Normally the `address` step (if any) sits before `review`, so `tax.addressSource`
  // comes back "collected" here — `estimatedAddress` only kicks in for a *checkpoint*
  // review placed earlier in the flow, before the visitor reached `address`.
  const tax = useTaxCalculation(
    flow,
    answers,
    paymentStep?.calculateTax,
    paymentStep?.taxBehavior ?? "exclusive",
    Boolean(orderSummary),
    estimatedAddress,
  )

  // The `catalog` step's own report row would just repeat the summary table above it.
  const rows = buildReportRows(flow, answers, visitedStepIds).filter((row) => {
    if (!orderSummary) return true
    const source = flow.steps.find((s) => s.id === row.stepId)
    return source?.type !== "catalog"
  })

  return (
    <div className="fk-step fk-step-review">
      <StepTitle image={step.image} title={step.title} />
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      {orderSummary && (
        <OrderSummaryTable
          summary={orderSummary}
          tax={tax}
          locale={flow.locale}
          flow={flow}
          totalLabel={resolveText(flow, "paymentTotal")}
        />
      )}
      {pendingPayment && (
        <div className="fk-review-total">
          <span className="fk-review-total-label">{resolveText(flow, "paymentTotal")}</span>
          <span className="fk-review-total-amount">
            {formatMoney(pendingPayment.amount, pendingPayment.currency, flow.locale)}
          </span>
        </div>
      )}
      {step.meta && <div className="fk-review-meta">{step.meta}</div>}
      <ReportRows rows={rows} onRowClick={onNavigateToStep} />
    </div>
  )
}
