import { useEffect, useRef, useState } from "react"
import type { VerificationProvider, VerificationStep, VerificationValue } from "@flowkit-io/core"
import { resolveText } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { loadExternalScript } from "./shared/external-script"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"

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

export function VerificationStepView({ step, value, onChange, flow }: StepComponentProps<VerificationStep>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | number | null>(null)
  const renderedRef = useRef(false)
  const [scriptStatus, setScriptStatus] = useState<"loading" | "ready" | "error">("loading")
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const skipWidget = step.enabled === false || step.previewVerified === true

  useEffect(() => {
    if (skipWidget) return
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
  }, [step.provider, skipWidget])

  useEffect(() => {
    if (step.enabled !== false && step.previewVerified === true) {
      onChange({ verified: true, provider: step.provider })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.enabled, step.previewVerified, step.provider])

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
          setVerifyError(resolveText(flow, "verificationFailedRetry"))
          if (widgetIdRef.current !== null) getWidgetApi(step.provider)?.reset(widgetIdRef.current)
        }
      })
      .catch(() => {
        setVerifying(false)
        setVerifyError(resolveText(flow, "verificationErrorRetry"))
        if (widgetIdRef.current !== null) getWidgetApi(step.provider)?.reset(widgetIdRef.current)
      })
  }

  useEffect(() => {
    if (skipWidget) return
    if (scriptStatus !== "ready" || renderedRef.current || !containerRef.current) return
    const api = getWidgetApi(step.provider)
    if (!api) return
    widgetIdRef.current = api.render(containerRef.current, {
      sitekey: step.siteKey,
      callback: handleWidgetToken,
      "error-callback": () => setVerifyError(resolveText(flow, "verificationWidgetError")),
    })
    renderedRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptStatus, skipWidget])

  if (step.enabled === false) {
    return (
      <div className="fk-step fk-step-verification">
        <StepTitle image={step.image} title={step.title} />
        {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      </div>
    )
  }

  const verified = step.previewVerified === true || asVerificationValue(value)?.verified === true

  return (
    <div className="fk-step fk-step-verification">
      <StepTitle image={step.image} title={step.title} />
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      {verified ? (
        <div className="fk-loc-row">
          <div className="fk-loc-ic">✅</div>
          <div className="fk-loc-title">{resolveText(flow, "verificationCompleted")}</div>
        </div>
      ) : (
        <>
          <div ref={containerRef} className="fk-verification-widget" />
          {scriptStatus === "loading" && (
            <p className="fk-map-search-loading">{resolveText(flow, "verificationLoadingWidget")}</p>
          )}
          {scriptStatus === "error" && (
            <p className="fk-gps-error">{resolveText(flow, "verificationLoadError")}</p>
          )}
          {verifying && <p className="fk-map-search-loading">{resolveText(flow, "verificationInProgress")}</p>}
          {verifyError && <p className="fk-gps-error">{verifyError}</p>}
        </>
      )}
    </div>
  )
}
