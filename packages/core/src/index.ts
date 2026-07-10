// Ordine critico: i side-effect import registrano i tipi di step nel registry.
// "location-step" e "oauth" devono essere valutati DOPO "builtins" (location-step
// sostituisce la registrazione base di "location" con la config estesa). Vanno messi
// prima di qualsiasi "export * from"/"export {...} from" verso questi stessi moduli:
// un re-export è anch'esso un import e, se scritto prima nel file, farebbe valutare
// quel modulo (e il suo registerStepType) in anticipo, rompendo l'ordine voluto.
import "./builtins"
import "./oauth"
import "./location-step"
import "./group-step"

export * from "./schema"
export * from "./machine"
export * from "./i18n"
export * from "./registry"
export * from "./oauth-providers"
export * from "./pkce"
export { oauthProviderConfigSchema, oauthStepSchema, completeOAuthCallback } from "./oauth"
export type { OAuthStep } from "./oauth"
export * from "./geocoding"
export { locationStepConfigSchema } from "./location-step"
export type { LocationStepConfig, SelectionMode } from "./location-step"
export { groupStepSchema } from "./group-step"
export type { GroupStep } from "./group-step"
