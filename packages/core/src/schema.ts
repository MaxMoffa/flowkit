import { z } from "zod"
import { getStepTypeDefinition } from "./registry"
import { stepAddonSchema } from "./addons"

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
import type { ScaleStep } from "./scale-step"
import type { ChipsStep } from "./chips-step"
import type { FacesStep } from "./faces-step"
import type { NotesStep } from "./notes-step"
import type { MediaStep } from "./media-step"
import type { FileStep } from "./file-step"
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

export const baseStepFields = {
  id: z.string().min(1),
  title: z.string().optional(),
  subtitle: z.string().optional(),
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
  scale: ScaleStep
  chips: ChipsStep
  faces: FacesStep
  notes: NotesStep
  media: MediaStep
  file: FileStep
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
  | "scale"
  | "chips"
  | "faces"
  | "notes"
  | "media"
  | "file"
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
}

const flowShapeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  locale: z.string().default("it"),
  steps: z.array(z.unknown()).min(1),
  disableBack: z.boolean().default(false),
  timezone: z.string().default("UTC"),
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

type StepWithKeyFields = { id: string; title?: string; key?: string; steps?: Step[] }

/**
 * Resolves and materializes `step.key` on every step (recursing into `group`
 * children): explicit `key` wins, else the title is slugified, else the id is.
 * Mutates the parsed steps in place — after `parseFlow`, every step's `.key` is
 * guaranteed to be a valid, flow-unique string (read it via `answerKey()`, machine.ts,
 * rather than `step.key` directly — steps parsed by calling a type's schema.parse()
 * directly, bypassing parseFlow, never go through this resolution). Throws on a
 * duplicate resolved key anywhere in the flow, including across a top-level step and a
 * nested group child: the key names a field in the same flat `answers` object for both.
 */
export function resolveStepKeys(steps: Step[]): void {
  const seen = new Map<string, StepWithKeyFields>()

  function visit(list: Step[]): void {
    for (const raw of list) {
      const step = raw as unknown as StepWithKeyFields
      const resolvedKey = step.key ?? slugify(step.title ?? step.id)
      const existing = seen.get(resolvedKey)
      if (existing) {
        throw new Error(
          `Invalid flow: duplicate step key "${resolvedKey}" — step id="${existing.id}"` +
            `${existing.title ? ` (title="${existing.title}")` : ""} and step id="${step.id}"` +
            `${step.title ? ` (title="${step.title}")` : ""} both resolve to it. Set an explicit, unique "key" on one of them.`,
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
  const shape = flowShapeSchema.parse(input)
  const steps = shape.steps.map(parseStep)
  assertFlowStepOrder(steps)
  resolveStepKeys(steps)
  return { ...shape, steps }
}
