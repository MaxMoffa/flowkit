// Critical ordering: the side-effect imports register step types in the registry.
// "location-step" and "oauth" must be evaluated AFTER "builtins" (location-step
// replaces the base "location" registration with the extended config). They must
// come before any "export * from"/"export {...} from" targeting these same modules:
// a re-export is also an import, and if written earlier in the file it would cause
// that module (and its registerStepType) to be evaluated early, breaking the
// intended order.
import "./builtins"
import "./oauth-step"
import "./location-step"
import "./location-leaflet-step"
import "./group-step"
import "./signature-step"
import "./payment-stripe-step"
import "./verification-step"

export * from "./schema"
export * from "./machine"
export * from "./upload-item"
export * from "./report"
export * from "./i18n"
export * from "./registry"
export * from "./oauth-providers"
export * from "./pkce"
export { oauthProviderConfigSchema, oauthStepSchema, completeOAuthCallback } from "./oauth-step"
export type { OAuthStep } from "./oauth-step"
export * from "./geocoding"
export { locationStepConfigSchema } from "./location-step"
export type { LocationStepConfig, SelectionMode } from "./location-step"
export { locationLeafletStepConfigSchema } from "./location-leaflet-step"
export type { LocationLeafletStepConfig } from "./location-leaflet-step"
export { groupStepSchema } from "./group-step"
export type { GroupStep } from "./group-step"
export { signatureStepSchema } from "./signature-step"
export type { SignatureStep } from "./signature-step"
export { paymentStripeStepSchema } from "./payment-stripe-step"
export type { PaymentStripeStep, PaymentStripeValue } from "./payment-stripe-step"
export { verificationStepSchema, verificationProviderSchema } from "./verification-step"
export type { VerificationStep, VerificationProvider, VerificationValue } from "./verification-step"
