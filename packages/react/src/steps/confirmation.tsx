import type { ConfirmationStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { EmailApiAction } from "./confirmation-actions/email-api-action"
import { EmailShareAction } from "./confirmation-actions/email-share-action"
import { NativeShareAction, canNativeShare } from "./confirmation-actions/native-share-action"
import { PdfExportAction } from "./confirmation-actions/pdf-export-action"
import { ResultLinkAction } from "./confirmation-actions/result-link-action"

/**
 * Final screen: confirmation mark, message, optional stats, and whichever result actions
 * the flow enabled. Each action owns its own state and lives in confirmation-actions/ —
 * they are independent features that only happen to share this screen.
 */
export function ConfirmationStepView({ step, flow, answers }: StepComponentProps<ConfirmationStep>) {
  const resultActions = step.resultActions

  return (
    <div className="fk-step fk-step-confirmation">
      <div className="fk-check">
        {step.emoji ? (
          <span className="fk-emoji-xl">{step.emoji}</span>
        ) : (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="var(--fk-success)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <h1 className="fk-title">{step.title}</h1>
      {step.message && <p className="fk-subtitle">{step.message}</p>}

      {step.stats && step.stats.length > 0 && (
        <div className="fk-stat-row">
          {step.stats.map((s, i) => (
            <div key={i} className="fk-stat-box">
              <div className="fk-stat-num">{s.value}</div>
              <div className="fk-stat-cap">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {step.emailShare?.enabled && (
        <EmailShareAction config={step.emailShare} fallbackSubject={step.title} answers={answers} />
      )}

      {resultActions?.pdfExport?.enabled && (
        <PdfExportAction
          config={resultActions.pdfExport}
          fallbackTitle={step.title}
          flow={flow}
          answers={answers}
        />
      )}

      {resultActions?.nativeShare?.enabled && canNativeShare() && (
        <NativeShareAction
          config={resultActions.nativeShare}
          fallbackTitle={step.title}
          answers={answers}
        />
      )}

      {resultActions?.resultLink?.enabled && (
        <ResultLinkAction config={resultActions.resultLink} answers={answers} />
      )}

      {resultActions?.emailApi?.enabled && (
        <EmailApiAction config={resultActions.emailApi} answers={answers} />
      )}
    </div>
  )
}
