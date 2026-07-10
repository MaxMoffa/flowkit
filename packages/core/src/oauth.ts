import { z } from "zod"
import { registerStepType } from "./registry"
import type { OAuthResult } from "./machine"

export const oauthProviderConfigSchema = z.object({
  id: z.string().min(1),
  clientId: z.string().min(1),
  authorizeUrl: z.string().optional(),
  scopes: z.array(z.string()).optional(),
  redirectUri: z.string().min(1),
  usePkce: z.boolean().default(true),
  extraAuthorizeParams: z.record(z.string()).optional(),
  /** Provider button icon (emoji). If absent, the known default on the react side is used. */
  icon: z.string().optional(),
})

export const oauthStepSchema = z.object({
  id: z.string().min(1),
  type: z.literal("oauth"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  required: z.boolean().default(true),
  icon: z.string().optional(),
  providers: z.array(oauthProviderConfigSchema).min(1),
  /** If true, shows an option to proceed without authenticating (anonymous). */
  allowAnonymous: z.boolean().default(false),
  anonymousLabel: z.string().optional(),
})

export type OAuthStep = z.infer<typeof oauthStepSchema>

registerStepType({
  type: "oauth",
  schema: oauthStepSchema,
  validate: (step, value) => {
    const result = value as OAuthResult | null
    if (!result || typeof result !== "object") return false
    if (step.allowAnonymous && result.anonymous) return true
    return Boolean(result.code || result.token)
  },
})

/**
 * Extracts the OAuth result (code/state, or token for implicit flows) from
 * the return redirect URI. Should be called by the host app after the
 * redirect: the library never performs the code→token exchange.
 */
export function completeOAuthCallback(
  providerId: string,
  source: string | URLSearchParams,
): OAuthResult {
  const params =
    typeof source === "string"
      ? new URLSearchParams(source.includes("?") ? source.split("?")[1] : source.replace(/^#/, ""))
      : source

  return {
    providerId,
    code: params.get("code") ?? undefined,
    token: params.get("access_token") ?? undefined,
    state: params.get("state") ?? undefined,
  }
}
