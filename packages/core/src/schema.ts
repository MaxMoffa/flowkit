import { z } from "zod"
import { getStepTypeDefinition } from "./registry"
import type { LocationStepConfig } from "./location-step"
import type { LocationLeafletStepConfig } from "./location-leaflet-step"
import type { OAuthStep } from "./oauth"

const baseStepFields = {
  id: z.string().min(1),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  required: z.boolean().default(true),
  icon: z.string().optional(),
  /**
   * Theme override (v2.10) limited to this step: a subset of colors, radii
   * and images applied only while the step is shown. Not typed against
   * ThemeTokens: core doesn't depend on @flowkit-io/themes, the validation/CSS
   * var mapping happens on the @flowkit-io/react side.
   */
  themeOverride: z.record(z.string(), z.unknown()).optional(),
}

export const introStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("intro"),
  emoji: z.string().optional(),
  cta: z.string().default("Inizia"),
  livePill: z.string().optional(),
})

export const locationStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("location"),
  placeholder: z.string().optional(),
  showMap: z.boolean().default(true),
  detectedLabel: z.string().optional(),
  detectedSubLabel: z.string().optional(),
  manualEntryLabel: z.string().optional(),
  /** Map fills the entire step viewport; title/search/GPS/result float as overlays on top. Default: false. */
  fullContainer: z.boolean().default(false),
})

export const selectCardsStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("select-cards"),
  multiple: z.boolean().default(false),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
        emoji: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .min(1),
})

export const scaleStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("scale"),
  min: z.number().default(1),
  max: z.number().default(5),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
  variant: z.enum(["pills", "slider"]).default("pills"),
  valueLabels: z.array(z.string()).optional(),
  valueColors: z.array(z.string()).optional(),
})

export const chipsStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("chips"),
  multiple: z.boolean().default(true),
  options: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .min(1),
})

export const durationChipValues = [
  "< 5 min",
  "5–30 min",
  "> 30 min",
  "Persistente",
] as const

export const facesStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("faces"),
  faces: z
    .array(z.object({ value: z.string(), emoji: z.string(), label: z.string().optional() }))
    .min(2)
    .default([
      { value: "1", emoji: "😞", label: "Pessimo" },
      { value: "2", emoji: "🙁", label: "Scarso" },
      { value: "3", emoji: "😐", label: "Ok" },
      { value: "4", emoji: "🙂", label: "Buono" },
      { value: "5", emoji: "😄", label: "Ottimo" },
    ]),
})

export const notesStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("notes"),
  placeholder: z.string().optional(),
})

export const photoStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("photo"),
  placeholder: z.string().optional(),
})

export const dateTimeStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("date-time"),
  mode: z.enum(["date", "time", "datetime"]).default("date"),
  min: z.string().optional(),
  max: z.string().optional(),
  step: z.number().optional(),
  disablePast: z.boolean().default(false),
  defaultValue: z.string().optional(),
})

export const npsStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("nps"),
  question: z.string().optional(),
})

export const multiSelectStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("multi-select"),
  options: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .min(1),
  min: z.number().default(0),
  max: z.number().optional(),
})

export const radioStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("radio"),
  options: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .min(1),
})

export const textStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("text"),
  variant: z.enum(["text", "number", "email"]).default("text"),
  placeholder: z.string().optional(),
  multiline: z.boolean().default(false),
})

export const reviewStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("review"),
  meta: z.string().optional(),
})

export const confirmationStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("confirmation"),
  title: z.string().default("Grazie!"),
  message: z.string().optional(),
  emoji: z.string().optional(),
  stats: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  primaryCta: z.string().optional(),
  secondaryCta: z.string().optional(),
  emailShare: z
    .object({
      enabled: z.boolean().default(false),
      subject: z.string().optional(),
      buttonLabel: z.string().default("Invia via email"),
      helpText: z.string().optional(),
    })
    .optional(),
  /**
   * Optional result actions, coexisting with emailShare (mailto).
   * `resultLink.createLink`/`emailApi.sendEmail` are functions injected by
   * the consumer (a pattern already used by mapAnswersToProperties in
   * notion.ts): they aren't JSON-serializable, so a flow using them must be
   * built as a TS/JS object, not loaded from plain JSON.
   */
  resultActions: z
    .object({
      pdfExport: z
        .object({
          enabled: z.boolean().default(false),
          buttonLabel: z.string().default("Scarica PDF"),
          documentTitle: z.string().optional(),
        })
        .optional(),
      resultLink: z
        .object({
          enabled: z.boolean().default(false),
          buttonLabel: z.string().default("Copia link"),
          helpText: z.string().optional(),
          createLink: z.custom<(answers: Record<string, unknown>) => Promise<{ url: string }>>(
            (v) => typeof v === "function",
          ),
        })
        .optional(),
      nativeShare: z
        .object({
          enabled: z.boolean().default(false),
          buttonLabel: z.string().default("Condividi"),
          shareTitle: z.string().optional(),
        })
        .optional(),
      emailApi: z
        .object({
          enabled: z.boolean().default(false),
          buttonLabel: z.string().default("Invia via email (server)"),
          helpText: z.string().optional(),
          sendEmail: z.custom<(email: string, answers: Record<string, unknown>) => Promise<void>>(
            (v) => typeof v === "function",
          ),
        })
        .optional(),
    })
    .optional(),
})

export type IntroStep = z.infer<typeof introStepSchema>
export type LocationStep = z.infer<typeof locationStepSchema>
export type SelectCardsStep = z.infer<typeof selectCardsStepSchema>
export type ScaleStep = z.infer<typeof scaleStepSchema>
export type ChipsStep = z.infer<typeof chipsStepSchema>
export type FacesStep = z.infer<typeof facesStepSchema>
export type NotesStep = z.infer<typeof notesStepSchema>
export type PhotoStep = z.infer<typeof photoStepSchema>
export type DateTimeStep = z.infer<typeof dateTimeStepSchema>
export type NpsStep = z.infer<typeof npsStepSchema>
export type MultiSelectStep = z.infer<typeof multiSelectStepSchema>
export type RadioStep = z.infer<typeof radioStepSchema>
export type TextStep = z.infer<typeof textStepSchema>
export type ReviewStep = z.infer<typeof reviewStepSchema>
export type ConfirmationStep = z.infer<typeof confirmationStepSchema>

/**
 * Maps type -> step shape. The built-in types are defined here; a consumer
 * registering a custom type with registerStepType can get full static
 * narrowing by augmenting this interface via module augmentation:
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
  photo: PhotoStep
  "date-time": DateTimeStep
  nps: NpsStep
  "multi-select": MultiSelectStep
  radio: RadioStep
  text: TextStep
  review: ReviewStep
  confirmation: ConfirmationStep
  oauth: OAuthStep
}

/** Step types shipped by flowkit out-of-the-box (not counting any custom augmentation). */
export type BuiltinStepType =
  | "intro"
  | "location"
  | "location-leaflet"
  | "select-cards"
  | "scale"
  | "chips"
  | "faces"
  | "notes"
  | "photo"
  | "date-time"
  | "nps"
  | "multi-select"
  | "radio"
  | "text"
  | "review"
  | "confirmation"

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
}

const flowShapeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  locale: z.string().default("it"),
  steps: z.array(z.unknown()).min(1),
})

export function parseFlow(input: unknown): Flow {
  const shape = flowShapeSchema.parse(input)
  return { ...shape, steps: shape.steps.map(parseStep) }
}
