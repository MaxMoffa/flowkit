import { z } from "zod"
import { getStepTypeDefinition } from "./registry"
import type { LocationStepConfig } from "./location-step"
import type { OAuthStep } from "./oauth"

const baseStepFields = {
  id: z.string().min(1),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  required: z.boolean().default(true),
  icon: z.string().optional(),
  /**
   * Override tema (v2.10) limitato a questo step: sottoinsieme di colori,
   * radii e immagini del tema applicato solo mentre lo step è mostrato.
   * Non tipizzato contro ThemeTokens: core non dipende da @flowkit/themes,
   * la validazione/mappatura in CSS var avviene lato @flowkit/react.
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
   * Azioni opzionali sul risultato, in coesistenza con emailShare (mailto).
   * `resultLink.createLink`/`emailApi.sendEmail` sono funzioni iniettate dal
   * consumer (pattern già usato da mapAnswersToProperties in notion.ts): non
   * sono JSON-serializzabili, quindi un flow che le usa va costruito come
   * oggetto TS/JS, non caricato da JSON puro.
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
export type NpsStep = z.infer<typeof npsStepSchema>
export type MultiSelectStep = z.infer<typeof multiSelectStepSchema>
export type TextStep = z.infer<typeof textStepSchema>
export type ReviewStep = z.infer<typeof reviewStepSchema>
export type ConfirmationStep = z.infer<typeof confirmationStepSchema>

/**
 * Mappa type -> forma dello step. I 12 tipi built-in sono definiti qui; un
 * consumer che registra un tipo custom con registerStepType può ottenere
 * narrowing statico completo aumentando questa interfaccia via module
 * augmentation:
 *
 *   declare module "@flowkit/core" {
 *     interface StepTypeMap {
 *       "rating-stars": RatingStarsStep
 *     }
 *   }
 *
 * Senza augmentation, uno step custom resta comunque valido a runtime
 * (validato dal registry), ma richiede un cast a Step lato consumer.
 */
export interface StepTypeMap {
  intro: IntroStep
  /** Config estesa (mappa reale maplibre-gl, v2.8), non lo schema base sopra. */
  location: LocationStepConfig
  "select-cards": SelectCardsStep
  scale: ScaleStep
  chips: ChipsStep
  faces: FacesStep
  notes: NotesStep
  photo: PhotoStep
  nps: NpsStep
  "multi-select": MultiSelectStep
  text: TextStep
  review: ReviewStep
  confirmation: ConfirmationStep
  oauth: OAuthStep
}

/** Tipi di step forniti da flowkit out-of-the-box (senza contare eventuali augmentation custom). */
export type BuiltinStepType =
  | "intro"
  | "location"
  | "select-cards"
  | "scale"
  | "chips"
  | "faces"
  | "notes"
  | "photo"
  | "nps"
  | "multi-select"
  | "text"
  | "review"
  | "confirmation"

export type Step = StepTypeMap[keyof StepTypeMap]
export type StepType = keyof StepTypeMap

const baseStepShape = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
})

/** Valida un singolo step delegando allo schema registrato per il suo `type` (vedi registry.ts). */
export function parseStep(input: unknown): Step {
  const base = baseStepShape.passthrough().parse(input)
  const def = getStepTypeDefinition(base.type)
  if (!def) {
    throw new Error(
      `Tipo di step sconosciuto "${base.type}". Registralo con registerStepType() prima di chiamare parseFlow().`,
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
