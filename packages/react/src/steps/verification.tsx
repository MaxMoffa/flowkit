import { useEffect, useRef, useState } from "react"
import type { VerificationProvider, VerificationStep, VerificationValue } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { loadExternalScript } from "./shared/external-script"
import { FlowMarkdown } from "../markdown"

const PROVIDER_SCRIPT_SRC: Record<VerificationProvider, string> = {
  turnstile: "https://challenges.cloudflare.com/turnstile/v0/api.js",
  recaptcha: "https://www.google.com/recaptcha/api.js",
}

interface WidgetApi {
  render(
    container: HTMLElement,
    params: {
      sitekey: string
      callback: (token: string) => void
      "error-callback"?: () => void
    },
  ): string | number
  reset(id: string | number): void
}

function getWidgetApi(provider: VerificationProvider): WidgetApi | undefined {
  const w = window as unknown as { turnstile?: WidgetApi; grecaptcha?: WidgetApi }
  return provider === "turnstile" ? w.turnstile : w.grecaptcha
}

function asVerificationValue(value: unknown): VerificationValue | null {
  if (value === null || typeof value !== "object") return null
  const current = value as VerificationValue
  return typeof current.verified === "boolean" ? current : null
}

export function VerificationStepView({ step, value, onChange }: StepComponentProps<VerificationStep>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | number | null>(null)
  const renderedRef = useRef(false)
  const [scriptStatus, setScriptStatus] = useState<"loading" | "ready" | "error">("loading")
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  useEffect(() => {
    if (step.enabled === false) return
    let cancelled = false
    loadExternalScript(PROVIDER_SCRIPT_SRC[step.provider])
      .then(() => {
        if (!cancelled) setScriptStatus("ready")
      })
      .catch(() => {
        if (!cancelled) setScriptStatus("error")
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.provider, step.enabled])

  function handleWidgetToken(token: string) {
    setVerifying(true)
    setVerifyError(null)
    step
      .verifyToken(token, step.provider)
      .then((ok) => {
        setVerifying(false)
        if (ok) {
          onChange({ verified: true, token, provider: step.provider })
        } else {
          setVerifyError("Verifica non riuscita, riprova.")
          if (widgetIdRef.current !== null) getWidgetApi(step.provider)?.reset(widgetIdRef.current)
        }
      })
      .catch(() => {
        setVerifying(false)
        setVerifyError("Errore durante la verifica, riprova.")
        if (widgetIdRef.current !== null) getWidgetApi(step.provider)?.reset(widgetIdRef.current)
      })
  }

  useEffect(() => {
    if (step.enabled === false) return
    if (scriptStatus !== "ready" || renderedRef.current || !containerRef.current) return
    const api = getWidgetApi(step.provider)
    if (!api) return
    widgetIdRef.current = api.render(containerRef.current, {
      sitekey: step.siteKey,
      callback: handleWidgetToken,
      "error-callback": () => setVerifyError("Errore del widget di verifica."),
    })
    renderedRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptStatus, step.enabled])

  if (step.enabled === false) {
    return (
      <div className="fk-step fk-step-verification">
        {step.title && <h2 className="fk-title"><FlowMarkdown text={step.title} variant="inline" /></h2>}
        {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      </div>
    )
  }

  const verified = asVerificationValue(value)?.verified === true

  return (
    <div className="fk-step fk-step-verification">
      {step.title && <h2 className="fk-title"><FlowMarkdown text={step.title} variant="inline" /></h2>}
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      {verified ? (
        <div className="fk-loc-row">
          <div className="fk-loc-ic">✅</div>
          <div className="fk-loc-title">Verifica completata</div>
        </div>
      ) : (
        <>
          <div ref={containerRef} className="fk-verification-widget" />
          {scriptStatus === "loading" && <p className="fk-map-search-loading">Carico il widget di verifica…</p>}
          {scriptStatus === "error" && <p className="fk-gps-error">Impossibile caricare il widget di verifica.</p>}
          {verifying && <p className="fk-map-search-loading">Verifica in corso…</p>}
          {verifyError && <p className="fk-gps-error">{verifyError}</p>}
        </>
      )}
    </div>
  )
}
