import { knownOAuthProviders } from "./oauth-providers"

export interface OAuthProviderConfig {
  /** E.g. "google" | "github" | "facebook" | "generic" | a custom id. */
  id: string
  clientId: string
  /** Required if id isn't a known provider (see knownOAuthProviders). */
  authorizeUrl?: string
  scopes?: string[]
  redirectUri: string
  /** Defaults to true where supported (Web Crypto available). */
  usePkce?: boolean
  extraAuthorizeParams?: Record<string, string>
}

export interface PkcePair {
  verifier: string
  challenge: string
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ""
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/** Generates a PKCE pair (code_verifier/code_challenge S256) via Web Crypto. */
export async function generatePkcePair(): Promise<PkcePair> {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32))
  const verifier = base64UrlEncode(verifierBytes)
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
  const challenge = base64UrlEncode(new Uint8Array(digest))
  return { verifier, challenge }
}

/**
 * Builds the redirect URL to the OAuth provider. No network call: just URL
 * composition. The code→token exchange stays the host app's responsibility
 * (the library never performs it).
 */
export function buildAuthorizeUrl(provider: OAuthProviderConfig, pkce?: PkcePair): string {
  const authorizeUrl = provider.authorizeUrl ?? knownOAuthProviders[provider.id]?.authorizeUrl
  if (!authorizeUrl) {
    throw new Error(
      `No authorizeUrl for provider "${provider.id}". Specify an explicit authorizeUrl (required for unknown/"generic" providers).`,
    )
  }

  const url = new URL(authorizeUrl)
  url.searchParams.set("client_id", provider.clientId)
  url.searchParams.set("redirect_uri", provider.redirectUri)
  url.searchParams.set("response_type", "code")
  if (provider.scopes?.length) url.searchParams.set("scope", provider.scopes.join(" "))
  if (pkce) {
    url.searchParams.set("code_challenge", pkce.challenge)
    url.searchParams.set("code_challenge_method", "S256")
  }
  for (const [key, value] of Object.entries(provider.extraAuthorizeParams ?? {})) {
    url.searchParams.set(key, value)
  }
  return url.toString()
}
