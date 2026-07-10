import { useState } from "react"
import type { ConfirmationStep } from "@flowkit/core"
import type { StepComponentProps } from "../types"

function answersToText(answers: Record<string, unknown>): string {
  return Object.entries(answers)
    .map(([key, value]) => {
      if (value === null || value === undefined || value === "") return null
      if (typeof value === "object" && !Array.isArray(value)) {
        const obj = value as { text?: string; photo?: string }
        return `${key}: ${obj.text ?? ""}`
      }
      return `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`
    })
    .filter(Boolean)
    .join("\n")
}

export function ConfirmationStepView({ step, answers }: StepComponentProps<ConfirmationStep>) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)

  function sendEmail() {
    if (!email) return
    const subject = encodeURIComponent(step.emailShare?.subject ?? step.title)
    const body = encodeURIComponent(answersToText(answers))
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
    setSent(true)
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
    </div>
  )
}
