// Every built-in step type self-registers exactly once (its own {type}-step.ts calls
// registerStepType on import) — unlike the pre-split "builtins.ts placeholder +
// location-step.ts overwrite" arrangement this replaced, no two files register the same
// type anymore, so import order here has no effect on the end state of the registry.
// These still must come before any "export * from"/"export {...} from" targeting the
// same modules below, though: a re-export is also an import, and dependents (e.g. the
// registry.test.ts custom-step-type test) expect side effects to have already run by
// the time index.ts's exports are evaluated.
import "./intro-step"
import "./select-cards-step"
import "./scale-step"
import "./chips-step"
import "./faces-step"
import "./notes-step"
import "./media-step"
import "./file-step"
import "./media-display-step"
import "./date-time-step"
import "./nps-step"
import "./multi-select-step"
import "./radio-step"
import "./text-step"
import "./checkbox-step"
import "./review-step"
import "./confirmation-step"
import "./smart-fill-generators"
import "./oauth-step"
import "./location-step"
import "./location-leaflet-step"
import "./group-step"
import "./signature-step"
import "./payment-stripe-step"
import "./verification-step"
import "./booking-slot-step"
import "./branch-step"
import "./info-step"
import "./long-content-step"

export * from "./schema"
export * from "./intro-step"
export * from "./select-cards-step"
export * from "./scale-step"
export * from "./chips-step"
export * from "./faces-step"
export * from "./notes-step"
export * from "./media-step"
export * from "./file-step"
export * from "./media-display-step"
export * from "./date-time-step"
export * from "./nps-step"
export * from "./multi-select-step"
export * from "./radio-step"
export * from "./text-step"
export * from "./checkbox-step"
export * from "./review-step"
export * from "./confirmation-step"
export * from "./machine"
export * from "./addons"
export * from "./remote-data-source"
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
export {
  bookingSlotStepSchema,
  bookingSlotGranularitySchema,
  bookingSlotWeeklyWindowSchema,
  listBookingSlotDates,
  listBookingSlotsForDate,
} from "./booking-slot-step"
export type { BookingSlotStep, BookingSlot, BookingSlotValue } from "./booking-slot-step"
export {
  branchStepSchema,
  branchRuleSchema,
  conditionSchema,
  evaluateCondition,
} from "./branch-step"
export type { BranchStep, BranchRule, Condition, ConditionOp } from "./branch-step"
export { infoStepSchema } from "./info-step"
export type { InfoStep } from "./info-step"
export { longContentStepSchema } from "./long-content-step"
export type { LongContentStep } from "./long-content-step"
