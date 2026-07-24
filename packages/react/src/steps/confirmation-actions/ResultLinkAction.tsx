import { useState } from "react"
import type { Answers } from "@flowkit-io/core"
import type { ResultLinkConfig } from "./types"

interface ResultLinkActionProps {
  config: ResultLinkConfig
  answers: Answers
}

/** Asks the consumer's `createLink` callback for a shareable URL, then offers to copy it. */
export function ResultLinkAction({ config, answers }: ResultLinkActionProps) {
  const [resultLink, setResultLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createLink() {
    if (!config.createLink) return
    setLoading(true)
    setError(null)
    try {
      const { url } = await config.createLink(answers)
      setResultLink(url)
    } catch {
      setError("Non sono riuscito a generare il link. Riprova.")
    } finally {
      setLoading(false)
    }
  }

  async function copyLink() {
    if (!resultLink) return
    try {
      await navigator.clipboard.writeText(resultLink)
      setCopied(true)
    } catch {
      // Clipboard access can be denied by permissions or a non-secure context.
      setError("Non sono riuscito a copiare il link. Copialo a mano.")
    }
  }

  return (
    <div className="fk-result-link">
      {config.helpText && <p className="fk-email-share-help">{config.helpText}</p>}
      {!resultLink ? (
        <button
          type="button"
          className="fk-btn-neutral fk-result-link-btn"
          onClick={() => void createLink()}
          disabled={loading}
        >
          {loading ? "Genero il link…" : config.buttonLabel}
        </button>
      ) : (
        <div className="fk-email-share-row">
          <input className="fk-input" type="text" readOnly value={resultLink} />
          <button type="button" className="fk-email-share-btn" onClick={() => void copyLink()}>
            Copia
          </button>
        </div>
      )}
      {copied && <p className="fk-email-share-sent">Link copiato ✓</p>}
      {error && <p className="fk-email-api-error">{error}</p>}
    </div>
  )
}
