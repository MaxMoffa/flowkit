import { buildAuthorizeUrl, generatePkcePair, type OAuthResult, type OAuthStep } from "@flowkit/core"
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
    // Disaccoppiato da onChange: la libreria non gestisce mai lo scambio codice→token,
    // solo la costruzione dell'URL. È l'app host a completare il flow su redirect
    // (vedi completeOAuthCallback) e a passare il risultato allo step tramite onChange.
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
            <span className="fk-emoji">{providerIcons[provider.id] ?? "🔐"}</span>
            {connected?.providerId === provider.id ? `Connesso (${provider.id}) ✓` : `Continua con ${provider.id}`}
          </button>
        ))}
      </div>
      {connected && (
        <button type="button" className="fk-link" onClick={() => onChange(null)}>
          Disconnetti
        </button>
      )}
    </div>
  )
}
