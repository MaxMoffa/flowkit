import { parseFlow, type Flow, type VerificationProvider } from "@flowkit-io/core"

/**
 * Demo for the "verification" step (Turnstile/reCAPTCHA). The actual token
 * check with the provider's secret key must happen on a real backend — this
 * demo posts to a same-origin endpoint that doesn't exist in dev (fails
 * naturally, same "no real backend in this public demo" pattern as
 * result-actions-demo's emailApi); in e2e it's intercepted with page.route.
 */
function verifyToken(token: string, provider: VerificationProvider) {
  return fetch("/api/verify-demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, provider }),
  })
    .then((r) => r.json())
    .then((r: { ok?: boolean }) => r.ok === true)
    .catch(() => false)
}

export const verificationDemoFlow: Flow = parseFlow({
  id: "verification-demo",
  title: "Step di verifica",
  steps: [
    { id: "welcome", type: "intro", title: "Verifica umana", cta: "Prova" },
    {
      id: "verify",
      type: "verification",
      title: "Conferma di non essere un robot",
      provider: "turnstile",
      siteKey: "demo-site-key",
      verifyToken,
    },
    { id: "end", type: "confirmation", title: "Grazie!", showHomeButton: false },
  ],
})
