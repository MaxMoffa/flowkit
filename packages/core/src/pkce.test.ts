import { describe, expect, it } from "vitest"
import { buildAuthorizeUrl, generatePkcePair } from "./pkce"

describe("generatePkcePair", () => {
  it("generates a verifier and an S256 challenge, both base64url (no +/=)", async () => {
    const { verifier, challenge } = await generatePkcePair()
    expect(verifier.length).toBeGreaterThan(0)
    expect(challenge.length).toBeGreaterThan(0)
    expect(verifier).not.toMatch(/[+/=]/)
    expect(challenge).not.toMatch(/[+/=]/)
  })

  it("generates a different pair on every call", async () => {
    const a = await generatePkcePair()
    const b = await generatePkcePair()
    expect(a.verifier).not.toBe(b.verifier)
    expect(a.challenge).not.toBe(b.challenge)
  })

  it("derives the challenge as SHA-256(verifier), base64url-encoded", async () => {
    const { verifier, challenge } = await generatePkcePair()
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
    let binary = ""
    for (const b of new Uint8Array(digest)) binary += String.fromCharCode(b)
    const expected = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    expect(challenge).toBe(expected)
  })
})

describe("buildAuthorizeUrl", () => {
  it("builds a URL for a known provider without an explicit authorizeUrl", () => {
    const url = buildAuthorizeUrl({
      id: "google",
      clientId: "client-123",
      redirectUri: "https://app.example.com/callback",
    })
    const parsed = new URL(url)
    expect(parsed.searchParams.get("client_id")).toBe("client-123")
    expect(parsed.searchParams.get("redirect_uri")).toBe("https://app.example.com/callback")
    expect(parsed.searchParams.get("response_type")).toBe("code")
  })

  it("throws for an unknown provider with no explicit authorizeUrl", () => {
    expect(() =>
      buildAuthorizeUrl({ id: "generic", clientId: "c", redirectUri: "https://app.example.com/cb" }),
    ).toThrow(/No authorizeUrl/)
  })

  it("uses the explicit authorizeUrl when provided, even for a known id", () => {
    const url = buildAuthorizeUrl({
      id: "google",
      clientId: "c",
      redirectUri: "https://app.example.com/cb",
      authorizeUrl: "https://custom.example.com/oauth/authorize",
    })
    expect(url.startsWith("https://custom.example.com/oauth/authorize")).toBe(true)
  })

  it("includes scope only when scopes is non-empty", () => {
    const withScopes = buildAuthorizeUrl({
      id: "github",
      clientId: "c",
      redirectUri: "https://app.example.com/cb",
      scopes: ["read:user", "repo"],
    })
    expect(new URL(withScopes).searchParams.get("scope")).toBe("read:user repo")

    const withoutScopes = buildAuthorizeUrl({
      id: "github",
      clientId: "c",
      redirectUri: "https://app.example.com/cb",
    })
    expect(new URL(withoutScopes).searchParams.has("scope")).toBe(false)
  })

  it("adds code_challenge/code_challenge_method only when a pkce pair is passed", () => {
    const withoutPkce = buildAuthorizeUrl({
      id: "google",
      clientId: "c",
      redirectUri: "https://app.example.com/cb",
    })
    expect(new URL(withoutPkce).searchParams.has("code_challenge")).toBe(false)

    const withPkce = buildAuthorizeUrl(
      { id: "google", clientId: "c", redirectUri: "https://app.example.com/cb" },
      { verifier: "v", challenge: "chal123" },
    )
    const parsed = new URL(withPkce)
    expect(parsed.searchParams.get("code_challenge")).toBe("chal123")
    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256")
  })

  it("merges extraAuthorizeParams into the query string", () => {
    const url = buildAuthorizeUrl({
      id: "google",
      clientId: "c",
      redirectUri: "https://app.example.com/cb",
      extraAuthorizeParams: { prompt: "consent", access_type: "offline" },
    })
    const parsed = new URL(url)
    expect(parsed.searchParams.get("prompt")).toBe("consent")
    expect(parsed.searchParams.get("access_type")).toBe("offline")
  })
})
