import { buildAuthorizeUrl, generatePkcePair, type OAuthResult, type OAuthStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"

const providerIcons: Record<string, string> = {
  google: "🔵",
  github: "🐙",
  facebook: "🔷",
}

function verifierStorageKey(providerId: string): string {
  return `flowkit:oauth:${providerId}:verifier`
}

/** `value` is an untyped answer at this boundary (it can be a leftover from another step
 *  type or a rehydrated draft), so accept it only if it carries the shape this step writes. */
function asOAuthResult(value: unknown): OAuthResult | null {
  if (value === null || typeof value !== "object") return null
  const result = value as OAuthResult
  return typeof result.providerId === "string" ? result : null
}

export function OAuthStepView({ step, value, onChange }: StepComponentProps<OAuthStep>) {
  const connected = asOAuthResult(value)

  async function connect(provider: (typeof step.providers)[number]) {
    let pkce
    if (provider.usePkce !== false) {
      pkce = await generatePkcePair()
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(verifierStorageKey(provider.id), pkce.verifier)
      }
    }
    const url = buildAuthorizeUrl(provider, pkce)
    // Decoupled from onChange: the library never handles the code→token exchange,
    // only URL construction. The host app completes the flow on redirect
    // (see completeOAuthCallback) and passes the result to the step via onChange.
    window.location.href = url
  }

  return (
    <div className="fk-step fk-step-oauth">
      <StepTitle image={step.image} title={step.title} />
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      <div className="fk-oauth-providers">
        {step.providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            className={`fk-oauth-btn ${connected?.providerId === provider.id ? "fk-oauth-btn-connected" : ""}`}
            onClick={() => void connect(provider)}
          >
            <span className="fk-emoji">{provider.icon ?? providerIcons[provider.id] ?? "🔐"}</span>
            {connected?.providerId === provider.id ? `Connesso (${provider.id}) ✓` : `Continua con ${provider.id}`}
          </button>
        ))}
      </div>
      {step.allowAnonymous && !connected?.anonymous && (
        <button
          type="button"
          className="fk-link"
          onClick={() => onChange({ providerId: "", anonymous: true })}
        >
          <FlowMarkdown text={step.anonymousLabel ?? "Continua senza account"} variant="inline" />
        </button>
      )}
      {connected?.anonymous && (
        <button type="button" className="fk-link" onClick={() => onChange(null)}>
          Continui in anonimo · Annulla
        </button>
      )}
      {connected && !connected.anonymous && (
        <button type="button" className="fk-link" onClick={() => onChange(null)}>
          Disconnetti
        </button>
      )}
    </div>
  )
}
