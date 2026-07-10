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
  const [resultLink, setResultLink] = useState<string | null>(null)
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [apiEmail, setApiEmail] = useState("")
  const [apiEmailStatus, setApiEmailStatus] = useState<"idle" | "loading" | "sent" | "error">("idle")

  function sendEmail() {
    if (!email) return
    const subject = encodeURIComponent(step.emailShare?.subject ?? step.title)
    const body = encodeURIComponent(answersToText(answers))
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
    setSent(true)
  }

  async function createLink() {
    const createLinkFn = step.resultActions?.resultLink?.createLink
    if (!createLinkFn) return
    setLinkLoading(true)
    try {
      const { url } = await createLinkFn(answers)
      setResultLink(url)
    } finally {
      setLinkLoading(false)
    }
  }

  async function copyLink() {
    if (!resultLink) return
    await navigator.clipboard.writeText(resultLink)
    setLinkCopied(true)
  }

  async function sendViaApi() {
    const sendEmailFn = step.resultActions?.emailApi?.sendEmail
    if (!sendEmailFn || !apiEmail) return
    setApiEmailStatus("loading")
    try {
      await sendEmailFn(apiEmail, answers)
      setApiEmailStatus("sent")
    } catch {
      setApiEmailStatus("error")
    }
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

      {step.resultActions?.resultLink?.enabled && (
        <div className="fk-result-link">
          {step.resultActions.resultLink.helpText && (
            <p className="fk-email-share-help">{step.resultActions.resultLink.helpText}</p>
          )}
          {!resultLink ? (
            <button
              type="button"
              className="fk-btn-neutral fk-result-link-btn"
              onClick={() => void createLink()}
              disabled={linkLoading}
            >
              {linkLoading ? "Genero il link…" : step.resultActions.resultLink.buttonLabel}
            </button>
          ) : (
            <div className="fk-email-share-row">
              <input className="fk-input" type="text" readOnly value={resultLink} />
              <button type="button" className="fk-email-share-btn" onClick={() => void copyLink()}>
                Copia
              </button>
            </div>
          )}
          {linkCopied && <p className="fk-email-share-sent">Link copiato ✓</p>}
        </div>
      )}

      {step.resultActions?.emailApi?.enabled && (
        <div className="fk-email-share">
          {step.resultActions.emailApi.helpText && (
            <p className="fk-email-share-help">{step.resultActions.emailApi.helpText}</p>
          )}
          <div className="fk-email-share-row">
            <input
              className="fk-input"
              type="email"
              placeholder="tuo@email.it"
              value={apiEmail}
              onChange={(e) => {
                setApiEmail(e.target.value)
                setApiEmailStatus("idle")
              }}
            />
            <button
              type="button"
              className="fk-email-share-btn fk-email-api-btn"
              onClick={() => void sendViaApi()}
              disabled={apiEmailStatus === "loading"}
            >
              {apiEmailStatus === "loading" ? "Invio…" : step.resultActions.emailApi.buttonLabel}
            </button>
          </div>
          {apiEmailStatus === "sent" && <p className="fk-email-share-sent">Email inviata ✓</p>}
          {apiEmailStatus === "error" && <p className="fk-email-api-error">Invio fallito. Riprova.</p>}
        </div>
      )}
    </div>
  )
}
