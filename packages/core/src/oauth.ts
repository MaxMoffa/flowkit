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
  /** Icona (emoji) del bottone provider. Se assente, si usa quella nota di default lato react. */
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
  /** Se true, mostra un'opzione per procedere senza autenticarsi (anonimo). */
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
 * Estrae il risultato OAuth (code/state, o token per i flow implicit) dalla
 * redirect URI di ritorno. Va chiamata dall'app host dopo il redirect: la
 * libreria non esegue mai lo scambio codice→token.
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
