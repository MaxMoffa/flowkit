import { z } from "zod"
import { getStepTypeDefinition } from "./registry"
import { stepAddonSchema } from "./addons"
import { CURRENT_FLOW_SCHEMA_VERSION, migrateFlowInput } from "./flow-versioning"

/** Shared by every "elenco/select" step schema: at least one static option, or a
 *  dataSource to fetch them from (checked as one zod `.refine`, not per-field, so the
 *  error path/message stay consistent across select-cards/chips/radio/multi-select).
 *  Exported for select-cards-step.ts/chips-step.ts/radio-step.ts/multi-select-step.ts. */
export function requireOptionsOrDataSource(step: { options: unknown[]; dataSource?: unknown }) {
  return step.options.length > 0 || !!step.dataSource
}
export const optionsOrDataSourceIssue = {
  message: "Provide at least one option, or a dataSource.",
  path: ["options"],
}
import type { LocationStepConfig } from "./location-step"
import type { LocationLeafletStepConfig } from "./location-leaflet-step"
import type { OAuthStep } from "./oauth-step"
import type { SignatureStep } from "./signature-step"
import type { PaymentStripeStep } from "./payment-stripe-step"
import type { VerificationStep } from "./verification-step"
import type { BookingSlotStep } from "./booking-slot-step"
import type { IntroStep } from "./intro-step"
import type { SelectCardsStep } from "./select-cards-step"
import type { CatalogStep } from "./catalog-step"
import type { ProductStep } from "./product-step"
import type { AddressStep } from "./address-step"
import type { ScaleStep } from "./scale-step"
import type { ChipsStep } from "./chips-step"
import type { FacesStep } from "./faces-step"
import type { NotesStep } from "./notes-step"
import type { MediaStep } from "./media-step"
import type { FileStep } from "./file-step"
import type { PhotoStep } from "./photo-step"
import type { BarcodeScanStep } from "./barcode-scan-step"
import type { MediaDisplayStep } from "./media-display-step"
import type { DateTimeStep } from "./date-time-step"
import type { NpsStep } from "./nps-step"
import type { MultiSelectStep } from "./multi-select-step"
import type { RadioStep } from "./radio-step"
import type { TextStep } from "./text-step"
import type { CheckboxStep } from "./checkbox-step"
import type { ReviewStep } from "./review-step"
import type { ConfirmationStep } from "./confirmation-step"
import type { InfoStep } from "./info-step"
import type { LongContentStep } from "./long-content-step"
import type { BranchStep } from "./branch-step"

/**
 * Fields every step accepts, whatever its `type`. Exported so step definitions living
 * outside this file (group, oauth, signature, payment-stripe, …) can spread it instead
 * of retyping it: the copies had already drifted apart once, leaving the oauth step
 * without `themeOverride`/`contentAlign` while the docs promised them everywhere.
 */
/**
 * Unified step image field (v2.34): a step's own badge/icon, replacing the old
 * `icon` (never actually rendered outside the review-row fallback) and `intro`'s
 * separate `emoji` field. `kind` picks how `value` is interpreted:
 * - "emoji": a literal emoji character, rendered as text.
 * - "icon": raw inline SVG markup, sanitized and rendered so it inherits the
 *   surrounding text color (adapts to light/dark themes).
 * - "image": a URL or `data:` URI (raster or SVG), rendered via `<img>`.
 * No picker ships with the library: consumers author `value` themselves.
 */
export const stepImageSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("emoji"), value: z.string().min(1) }),
  z.object({ kind: z.literal("icon"), value: z.string().min(1) }),
  z.object({ kind: z.literal("image"), value: z.string().min(1) }),
])

export type StepImage = z.infer<typeof stepImageSchema>

/**
 * A piece of flow *content* (as opposed to system/chrome text — see `flow.texts` /
 * `defaultMessages` in i18n.ts): either a literal string (default, zero-regression
 * behavior for every existing config) or `{ key, fallback? }`, resolved against the
 * flow's own `content` dictionary (`Flow.content`, a namespace separate from `texts`)
 * via `resolveContentText(flow, value)` in i18n.ts. Opt-in — a flow author keeps
 * writing literal strings unless they want the same flow served in multiple languages
 * without duplicating its structure. Kept here (not in i18n.ts) because i18n.ts
 * already imports from this file — declaring it there would create a cycle.
 */
export const contentTextSchema = z.union([
  z.string(),
  z.object({ key: z.string().min(1), fallback: z.string().optional() }),
])

export type ContentText = z.infer<typeof contentTextSchema>

/**
 * Shared by every option-list step (select-cards, multi-select, radio, chips): one
 * entry a visitor can pick. `description` renders under the label (especially useful
 * on multi-select); `color` is a CSS color (hex/rgb/named) that tints the whole
 * card/chip/list-item container the option renders as (in @flowkit-io/react) — both
 * optional, absent = current unstyled rendering (no regression for existing configs).
 * select-cards extends this with its own `emoji` field. `label`/`description` are
 * `ContentText` (v2.4x): a literal string still works everywhere, or `{ key, fallback? }`
 * to resolve from `flow.content` — see `resolveContentText`.
 */
export const optionSchema = z.object({
  value: z.string(),
  label: contentTextSchema,
  description: contentTextSchema.optional(),
  color: z.string().optional(),
  /**
   * Optional unit price in the payment currency's minor unit (cents). Absent = the
   * option is free / not a purchasable line. When the flow has a `payment-stripe`
   * step with `amountSource: "cart"`, selecting a priced option here adds it (quantity
   * 1) to the charged total — see `computeOrderTotal` (catalog-step.ts). No effect on
   * flows without a cart-sourced payment step.
   */
  price: z.number().int().nonnegative().optional(),
})

export type Option = z.infer<typeof optionSchema>

/**
 * Opt-in "Other" choice for a `radio` / `multi-select` step. Present = enabled. When the
 * user picks it, a free-text input appears and the answer is stored as that raw string
 * (a value not matching any option). `label`/`placeholder` fall back to the
 * `otherOption` / `otherOptionPlaceholder` i18n texts.
 */
export const otherOptionSchema = z.object({
  label: z.string().optional(),
  placeholder: z.string().optional(),
})

export type OtherOption = z.infer<typeof otherOptionSchema>

/**
 * One recovery action offered on the generic error screen (`Flow.errorScreen`).
 * Resolved to a labeled button by `resolveErrorScreen` (error-screen.ts) and carried
 * out by FlowRunner:
 * - `retry`   — re-run the operation that failed (offered only when one is actually
 *               retryable, e.g. a rejected review `onSubmit`)
 * - `goToStep`— jump to `stepId` (e.g. back to the `payment-stripe` step to pick
 *               another method); raised from the review step, the flow returns there
 *               once that step is answered again
 * - `back` / `restart` — the same moves the header / confirmation buttons make
 * - `home`    — navigate to `url`
 * - `dismiss` — just close the error screen, leaving the user where they were
 * `label` overrides the default i18n text for the button.
 */
export const errorActionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("retry"), label: z.string().optional() }),
  z.object({ kind: z.literal("goToStep"), stepId: z.string().min(1), label: z.string().optional() }),
  z.object({ kind: z.literal("back"), label: z.string().optional() }),
  z.object({ kind: z.literal("restart"), label: z.string().optional() }),
  z.object({ kind: z.literal("home"), url: z.string().min(1), label: z.string().optional() }),
  z.object({ kind: z.literal("dismiss"), label: z.string().optional() }),
])

export type ErrorAction = z.infer<typeof errorActionSchema>

/**
 * Opt-in generic error screen. NOT a step in `flow.steps` — FlowRunner shows it on
 * demand to explain a failure and offer recovery actions: automatically when a final
 * `review` step's `onSubmit` rejects (typically a declined deferred payment), or
 * imperatively via `ref.showError()` / a step's `props.onError()`. Absent = previous
 * behavior (a rejected `onSubmit` just shows a line under the review footer). Every
 * field here is a default the runtime payload can override per occurrence; `actions`
 * unset = FlowRunner picks a sensible set (retry + "change payment method" when the
 * flow has a payment step, retry + back otherwise).
 */
export const errorScreenConfigSchema = z.object({
  image: stepImageSchema.optional(),
  title: z.string().optional(),
  message: z.string().optional(),
  actions: z.array(errorActionSchema).optional(),
})

export type ErrorScreenConfig = z.infer<typeof errorScreenConfigSchema>

export const baseStepFields = {
  id: z.string().min(1),
  /** `ContentText` (v2.4x): literal string (unchanged default) or `{ key, fallback? }`
   *  resolved from `flow.content` — see `resolveContentText`. */
  title: contentTextSchema.optional(),
  subtitle: contentTextSchema.optional(),
  required: z.boolean().default(true),
  image: stepImageSchema.optional(),
  /**
   * Technical identifier used as the field name in collected flow data (answers,
   * export/integration payloads) — distinct from `id`, which stays the step's
   * internal navigation identifier. Lowercase letters, digits, underscore, no
   * spaces. Left unset, it's auto-generated from the step's title (see
   * `resolveStepKeys`); set it explicitly to override, or to give a stable name to
   * a step with no title.
   */
  key: z
    .string()
    .regex(/^[a-z0-9_]+$/, "key must be lowercase letters, digits and underscores only")
    .optional(),
  /**
   * Theme override (v2.10) limited to this step: a subset of colors, radii
   * and images applied only while the step is shown. Not typed against
   * ThemeTokens: core doesn't depend on @flowkit-io/themes, the validation/CSS
   * var mapping happens on the @flowkit-io/react side.
   */
  themeOverride: z.record(z.string(), z.unknown()).optional(),
  /**
   * Per-step override of the theme's layout.contentAlign, desktop-only
   * (>=1024px). Unset = falls back to the theme's value (default "top").
   */
  contentAlign: z.enum(["top", "center", "bottom"]).optional(),
  /** Add-ons (v2.29) applied to this step, e.g. "smartFill" on a text step. Any step
   *  type accepts the field; only the step types that know how to use a given add-on's
   *  `type` actually render/apply it. */
  addons: z.array(stepAddonSchema).optional(),
  /** Per-field overrides of the validation error messages (see registry.ts's
   *  ValidationRule/ValidationIssue), keyed by rule name. Unset rules fall back to
   *  flow.texts["validation.<rule>"], then the shipped default — see
   *  i18n.ts's resolveValidationMessage. */
  validationMessages: z.record(z.string(), z.string()).optional(),
}

/**
 * Maps type -> step shape. Each built-in type's schema/registration lives in its own
 * {type}-step.ts file (e.g. text-step.ts, chips-step.ts) — this file only imports their
 * types to assemble the map. A consumer registering a custom type with registerStepType
 * can get full static narrowing by augmenting this interface via module augmentation:
 *
 *   declare module "@flowkit-io/core" {
 *     interface StepTypeMap {
 *       "rating-stars": RatingStarsStep
 *     }
 *   }
 *
 * Without augmentation, a custom step is still valid at runtime (validated
 * by the registry), but requires a cast to Step on the consumer side.
 */
export interface StepTypeMap {
  intro: IntroStep
  /** Extended config (real maplibre-gl map, v2.8), not the base schema above. */
  location: LocationStepConfig
  /** Variant with Leaflet as the rendering engine (v2.15), same config as "location". */
  "location-leaflet": LocationLeafletStepConfig
  "select-cards": SelectCardsStep
  catalog: CatalogStep
  product: ProductStep
  address: AddressStep
  scale: ScaleStep
  chips: ChipsStep
  faces: FacesStep
  notes: NotesStep
  media: MediaStep
  file: FileStep
  photo: PhotoStep
  "barcode-scan": BarcodeScanStep
  "media-display": MediaDisplayStep
  "date-time": DateTimeStep
  nps: NpsStep
  "multi-select": MultiSelectStep
  radio: RadioStep
  text: TextStep
  checkbox: CheckboxStep
  review: ReviewStep
  confirmation: ConfirmationStep
  oauth: OAuthStep
  signature: SignatureStep
  "payment-stripe": PaymentStripeStep
  verification: VerificationStep
  "booking-slot": BookingSlotStep
  info: InfoStep
  "long-content": LongContentStep
  branch: BranchStep
}

/**
 * Step types shipped by flowkit out-of-the-box (not counting any custom augmentation).
 * Kept as an explicit union rather than `keyof StepTypeMap`, which would grow with any
 * consumer augmentation and stop meaning "builtin". `_AssertBuiltinsAreMapped` below
 * keeps the two in sync. "group" is absent on purpose: it is not in StepTypeMap either,
 * because typing its `steps: Step[]` there would close a cycle with Step itself.
 */
export type BuiltinStepType =
  | "intro"
  | "location"
  | "location-leaflet"
  | "select-cards"
  | "catalog"
  | "product"
  | "address"
  | "scale"
  | "chips"
  | "faces"
  | "notes"
  | "media"
  | "file"
  | "photo"
  | "barcode-scan"
  | "media-display"
  | "date-time"
  | "nps"
  | "multi-select"
  | "radio"
  | "text"
  | "checkbox"
  | "review"
  | "confirmation"
  | "oauth"
  | "signature"
  | "payment-stripe"
  | "verification"
  | "booking-slot"
  | "info"
  | "long-content"
  | "branch"

/** Compile-time guard: a builtin without an entry in StepTypeMap makes this fail. */
type _AssertBuiltinsAreMapped = BuiltinStepType extends keyof StepTypeMap ? true : never
const _assertBuiltinsAreMapped: _AssertBuiltinsAreMapped = true
void _assertBuiltinsAreMapped

export type Step = StepTypeMap[keyof StepTypeMap]
export type StepType = keyof StepTypeMap

const baseStepShape = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
})

/** Validates a single step by delegating to the schema registered for its `type` (see registry.ts). */
export function parseStep(input: unknown): Step {
  const base = baseStepShape.passthrough().parse(input)
  const def = getStepTypeDefinition(base.type)
  if (!def) {
    throw new Error(
      `Unknown step type "${base.type}". Register it with registerStepType() before calling parseFlow().`,
    )
  }
  return def.schema.parse(input) as Step
}

export interface Flow {
  id: string
  title: string
  locale: string
  steps: Step[]
  /**
   * Forward-only navigation: hides/disables the "Indietro" button (header + footer),
   * disables clickable review-step shortcuts, and blocks the browser's back button
   * from leaving the current step. Default false preserves current behavior.
   */
  disableBack: boolean
  /**
   * IANA timezone name (e.g. "Europe/Rome") this flow's date/time steps are
   * authored/interpreted in — fixed at the flow level, deliberately not the visitor's
   * browser timezone (see the "booking-slot" step, v2.31). Default "UTC".
   */
  timezone: string
  /**
   * Per-flow overrides of the chrome/navigation/validation/status text shipped by the
   * library (buttons, aria-labels, error and loading messages — see core/i18n.ts's
   * `defaultMessages`), keyed by the same string as `defaultMessages[locale]`. Unset
   * keys fall back to the dictionary entry for `locale`, then the Italian default.
   * Resolve a value with `resolveText(flow, key, fallback?)`.
   */
  texts?: Record<string, string>
  /**
   * Free-form dictionary for the flow's own *content* (step title/subtitle, option
   * labels/descriptions, catalog/product item text, …), keyed however the flow author
   * likes — a separate namespace from `texts`, which is reserved for the library's
   * fixed system/chrome keys (`defaultMessages`). Populated by a `ContentText` value
   * of shape `{ key, fallback? }` anywhere one is accepted; resolve with
   * `resolveContentText(flow, value)`. Unset = every `ContentText` field in the flow
   * must be a literal string (or fall back to its own `fallback`/`key`).
   */
  content?: Record<string, string>
  /**
   * Version of this flow config's own shape (see flow-versioning.ts) — always exactly
   * `CURRENT_FLOW_SCHEMA_VERSION` on a `Flow` returned by `parseFlow`, regardless of
   * what a stored/saved flow originally carried: `parseFlow` migrates it up before
   * validating. Not the `@flowkit-io/core` npm package's version, a separate, much
   * slower-moving number — most releases of this library never bump it.
   */
  schemaVersion: number
  /**
   * Opt-in generic error screen shown by FlowRunner outside the normal step flow —
   * see `errorScreenConfigSchema` and `resolveErrorScreen` (error-screen.ts). Unset =
   * a rejected review `onSubmit` just shows a message under the footer (previous
   * behavior).
   */
  errorScreen?: ErrorScreenConfig
}

const flowShapeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  locale: z.string().default("it"),
  steps: z.array(z.unknown()).min(1),
  disableBack: z.boolean().default(false),
  timezone: z.string().default("UTC"),
  texts: z.record(z.string(), z.string()).optional(),
  content: z.record(z.string(), z.string()).optional(),
  errorScreen: errorScreenConfigSchema.optional(),
  /** See flow-versioning.ts. `parseFlow` always migrates up to
   *  `CURRENT_FLOW_SCHEMA_VERSION` before this schema ever validates the input, so
   *  this default only matters for a direct `flowShapeSchema.parse()` call bypassing
   *  that step (parseFlow is the only real caller). */
  schemaVersion: z.number().int().positive().default(CURRENT_FLOW_SCHEMA_VERSION),
})

/**
 * Enforces that every flow starts with a "role: intro" step and ends with a
 * "role: confirmation" step, with no other step carrying either role in
 * between. Roles are resolved from the step type registry (registry.ts),
 * not hardcoded type strings, so custom intro/confirmation replacements
 * registered via registerStepType are honored too.
 */
function assertFlowStepOrder(steps: Step[]): void {
  const roleOf = (step: Step) => getStepTypeDefinition(step.type)?.role
  const first = steps[0]!
  const last = steps[steps.length - 1]!

  if (roleOf(first) !== "intro") {
    throw new Error(
      `Invalid flow: the first step (id="${first.id}", type="${first.type}") must be a step type with role "intro".`,
    )
  }
  if (roleOf(last) !== "confirmation") {
    throw new Error(
      `Invalid flow: the last step (id="${last.id}", type="${last.type}") must be a step type with role "confirmation".`,
    )
  }
  for (let i = 1; i < steps.length - 1; i++) {
    const step = steps[i]!
    const role = roleOf(step)
    if (role === "intro" || role === "confirmation") {
      throw new Error(
        `Invalid flow: step at index ${i} (id="${step.id}", type="${step.type}") has role "${role}" but only the first/last step may have that role.`,
      )
    }
  }

  // Hybrid review rule: any number of role:"review" steps are allowed (checkpoints
  // for partial mid-flow recaps), but at most one may be a "final" recap (mode !==
  // "checkpoint"), and if present it must sit immediately before confirmation.
  const reviewEntries = steps
    .map((step, index) => ({ step, index, role: roleOf(step) }))
    .filter((entry) => entry.role === "review")

  const finalReviews = reviewEntries.filter(
    (entry) => (entry.step as { mode?: string }).mode !== "checkpoint",
  )

  if (finalReviews.length > 1) {
    throw new Error(
      `Invalid flow: only one step with role "review" and mode "final" is allowed, found ${finalReviews.length} (ids: ${finalReviews.map((e) => e.step.id).join(", ")}).`,
    )
  }

  if (finalReviews.length === 1) {
    const { step: finalReview, index: finalIndex } = finalReviews[0]!
    const expectedIndex = steps.length - 2
    if (finalIndex !== expectedIndex) {
      throw new Error(
        `Invalid flow: the final review step (id="${finalReview.id}") must be the second-to-last step (index ${expectedIndex}), found at index ${finalIndex}.`,
      )
    }
  }
}

/** Lowercase, non `[a-z0-9]` runs collapsed to a single `_`, trimmed — same shape the
 *  `key` field's own regex requires, so a slugified title/id always validates. */
export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
  return slug || "step"
}

type StepWithKeyFields = { id: string; title?: ContentText; key?: string; steps?: Step[] }

/** Minimal, import-cycle-free version of i18n.ts's `resolveContentText`: schema.ts
 *  can't import from i18n.ts (i18n.ts already imports `Flow`/`Step` from here), so
 *  `resolveStepKeys` needs its own copy of the same three-step fallback (dictionary
 *  entry -> value's own fallback -> its key) to slugify a `ContentText` title. */
function resolveContentTextForSlug(content: Record<string, string> | undefined, value: ContentText): string {
  if (typeof value === "string") return value
  return content?.[value.key] ?? value.fallback ?? value.key
}

/**
 * Resolves and materializes `step.key` on every step (recursing into `group`
 * children): explicit `key` wins, else the title is slugified, else the id is.
 * Mutates the parsed steps in place — after `parseFlow`, every step's `.key` is
 * guaranteed to be a valid, flow-unique string (read it via `answerKey()`, machine.ts,
 * rather than `step.key` directly — steps parsed by calling a type's schema.parse()
 * directly, bypassing parseFlow, never go through this resolution). Throws on a
 * duplicate resolved key anywhere in the flow, including across a top-level step and a
 * nested group child: the key names a field in the same flat `answers` object for both.
 * `content` is the flow's `content` dictionary (see `Flow.content`), used to resolve a
 * `ContentText` title before slugifying it — a title of shape `{ key, fallback? }`
 * slugifies its resolved text, same as a literal string title would.
 */
export function resolveStepKeys(steps: Step[], content?: Record<string, string>): void {
  const seen = new Map<string, StepWithKeyFields>()

  function visit(list: Step[]): void {
    for (const raw of list) {
      const step = raw as unknown as StepWithKeyFields
      const resolvedTitle = step.title !== undefined ? resolveContentTextForSlug(content, step.title) : undefined
      const resolvedKey = step.key ?? slugify(resolvedTitle ?? step.id)
      const existing = seen.get(resolvedKey)
      if (existing) {
        const existingTitle =
          existing.title !== undefined ? resolveContentTextForSlug(content, existing.title) : undefined
        throw new Error(
          `Invalid flow: duplicate step key "${resolvedKey}" — step id="${existing.id}"` +
            `${existingTitle ? ` (title="${existingTitle}")` : ""} and step id="${step.id}"` +
            `${resolvedTitle ? ` (title="${resolvedTitle}")` : ""} both resolve to it. Set an explicit, unique "key" on one of them.`,
        )
      }
      step.key = resolvedKey
      seen.set(resolvedKey, step)
      if (Array.isArray(step.steps)) visit(step.steps)
    }
  }

  visit(steps)
}

export function parseFlow(input: unknown): Flow {
  const shape = flowShapeSchema.parse(migrateFlowInput(input))
  const steps = shape.steps.map(parseStep)
  assertFlowStepOrder(steps)
  resolveStepKeys(steps, shape.content)
  return { ...shape, steps }
}
