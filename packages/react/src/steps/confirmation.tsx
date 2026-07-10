import { useState } from "react"
import type { ConfirmationStep } from "@flowkit/core"
import type { StepComponentProps } from "../types"

/** Appiattisce ricorsivamente answers (anche oggetti annidati da step "group") in testo piano.
 *  Valori che sembrano data URL (es. foto in base64) vengono omessi: non hanno senso in un
 *  riepilogo testuale/email e gonfierebbero inutilmente il corpo del messaggio. */
function answersToText(answers: Record<string, unknown>, prefix = ""): string {
  return Object.entries(answers)
    .flatMap(([key, value]) => {
      const label = prefix ? `${prefix}.${key}` : key
      if (value === null || value === undefined || value === "") return []
      if (typeof value === "string" && value.startsWith("data:")) return []
      if (typeof value === "object" && !Array.isArray(value)) {
        const nested = answersToText(value as Record<string, unknown>, label)
        return nested ? [nested] : []
      }
      return [`${label}: ${Array.isArray(value) ? value.join(", ") : String(value)}`]
    })
    .join("\n")
}

export function ConfirmationStepView({ step, answers }: StepComponentProps<ConfirmationStep>) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator

  function sendEmail() {
    if (!email) return
    const subject = encodeURIComponent(step.emailShare?.subject ?? step.title)
    const body = encodeURIComponent(answersToText(answers))
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
    setSent(true)
  }

  function shareNatively() {
    void navigator.share({
      title: step.resultActions?.nativeShare?.shareTitle ?? step.title,
      text: answersToText(answers),
    })
  }

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
        <div className="fk-email-share">
          {step.emailShare.helpText && <p className="fk-email-share-help">{step.emailShare.helpText}</p>}
          <div className="fk-email-share-row">
            <input
              className="fk-input"
              type="email"
              placeholder="tuo@email.it"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setSent(false)
              }}
            />
            <button type="button" className="fk-email-share-btn" onClick={sendEmail}>
              {step.emailShare.buttonLabel}
            </button>
          </div>
          {sent && <p className="fk-email-share-sent">Email preparata ✓</p>}
        </div>
      )}

      {step.resultActions?.pdfExport?.enabled && (
        <>
          <button
            type="button"
            className="fk-btn-neutral fk-pdf-export-btn"
            onClick={() => window.print()}
          >
            {step.resultActions.pdfExport.buttonLabel}
          </button>
          <div className="fk-print-recap">
            <h1>{step.resultActions.pdfExport.documentTitle ?? step.title}</h1>
            <pre>{answersToText(answers)}</pre>
          </div>
        </>
      )}

      {step.resultActions?.nativeShare?.enabled && canNativeShare && (
        <button type="button" className="fk-btn-neutral fk-native-share-btn" onClick={shareNatively}>
          {step.resultActions.nativeShare.buttonLabel}
        </button>
      )}
    </div>
  )
}
