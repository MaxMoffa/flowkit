import { buildAuthorizeUrl, generatePkcePair, type OAuthResult, type OAuthStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"

const providerIcons: Record<string, string> = {
  google: "🔵",
  github: "🐙",
  facebook: "🔷",
}

function verifierStorageKey(providerId: string): string {
  return `flowkit:oauth:${providerId}:verifier`
}

export function OAuthStepView({ step, value, onChange }: StepComponentProps<OAuthStep>) {
  const connected = value as OAuthResult | null

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
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
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
          {step.anonymousLabel ?? "Continua senza account"}
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
