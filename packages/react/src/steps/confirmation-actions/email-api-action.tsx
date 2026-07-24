import { useState } from "react"
import type { Answers } from "@flowkit-io/core"
import type { EmailApiConfig } from "./types"

interface EmailApiActionProps {
  config: EmailApiConfig
  answers: Answers
}

/** Sends the recap through the consumer's own backend, unlike the mailto action. */
export function EmailApiAction({ config, answers }: EmailApiActionProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle")

  async function send() {
    if (!config.sendEmail || !email) return
    setStatus("loading")
    try {
      await config.sendEmail(email, answers)
      setStatus("sent")
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="fk-email-share">
      {config.helpText && <p className="fk-email-share-help">{config.helpText}</p>}
      <div className="fk-email-share-row">
        <input
          className="fk-input"
          type="email"
          placeholder="tuo@email.it"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setStatus("idle")
          }}
        />
        <button
          type="button"
          className="fk-email-share-btn fk-email-api-btn"
          onClick={() => void send()}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Invio…" : config.buttonLabel}
        </button>
      </div>
      {status === "sent" && <p className="fk-email-share-sent">Email inviata ✓</p>}
      {status === "error" && <p className="fk-email-api-error">Invio fallito. Riprova.</p>}
    </div>
  )
}
