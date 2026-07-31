import { useState } from "react"
import type { Answers, Flow } from "@flowkit-io/core"
import { answersToText } from "../shared/answers-to-text"
import type { EmailShareConfig } from "./types"

interface EmailShareActionProps {
  config: EmailShareConfig
  /** Falls back to the step title when the config has no subject. */
  fallbackSubject: string
  answers: Answers
  flow: Flow
}

/** Opens the user's mail client with the recap prefilled. Nothing is sent by the library. */
export function EmailShareAction({ config, fallbackSubject, answers, flow }: EmailShareActionProps) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)

  function sendEmail() {
    if (!email) return
    const subject = encodeURIComponent(config.subject ?? fallbackSubject)
    const body = encodeURIComponent(answersToText(answers, "", flow))
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
    setSent(true)
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
            setSent(false)
          }}
        />
        <button type="button" className="fk-email-share-btn" onClick={sendEmail}>
          {config.buttonLabel}
        </button>
      </div>
      {sent && <p className="fk-email-share-sent">Email preparata ✓</p>}
    </div>
  )
}
