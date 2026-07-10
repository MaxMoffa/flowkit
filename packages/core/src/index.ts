// Critical ordering: the side-effect imports register step types in the registry.
// "location-step" and "oauth" must be evaluated AFTER "builtins" (location-step
// replaces the base "location" registration with the extended config). They must
// come before any "export * from"/"export {...} from" targeting these same modules:
// a re-export is also an import, and if written earlier in the file it would cause
// that module (and its registerStepType) to be evaluated early, breaking the
// intended order.
import "./builtins"
import "./oauth"
import "./location-step"
import "./location-leaflet-step"
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
export { locationLeafletStepConfigSchema } from "./location-leaflet-step"
export type { LocationLeafletStepConfig } from "./location-leaflet-step"
export { groupStepSchema } from "./group-step"
export type { GroupStep } from "./group-step"
