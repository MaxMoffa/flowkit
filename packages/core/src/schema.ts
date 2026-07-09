import { z } from "zod"

const baseStepFields = {
  id: z.string().min(1),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  required: z.boolean().default(true),
}

export const introStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("intro"),
  emoji: z.string().optional(),
  cta: z.string().default("Inizia"),
})

export const locationStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("location"),
  placeholder: z.string().optional(),
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
})

export const chipsStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("chips"),
  multiple: z.boolean().default(true),
  options: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .min(1),
})

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

export const notesPhotoStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("notes-photo"),
  allowPhoto: z.boolean().default(true),
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
})

export const confirmationStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("confirmation"),
  title: z.string().default("Grazie!"),
  message: z.string().optional(),
  emoji: z.string().optional(),
})

export const stepSchema = z.discriminatedUnion("type", [
  introStepSchema,
  locationStepSchema,
  selectCardsStepSchema,
  scaleStepSchema,
  chipsStepSchema,
  facesStepSchema,
  notesPhotoStepSchema,
  npsStepSchema,
  multiSelectStepSchema,
  textStepSchema,
  reviewStepSchema,
  confirmationStepSchema,
])

export type Step = z.infer<typeof stepSchema>
export type StepType = Step["type"]

export type IntroStep = z.infer<typeof introStepSchema>
export type LocationStep = z.infer<typeof locationStepSchema>
export type SelectCardsStep = z.infer<typeof selectCardsStepSchema>
export type ScaleStep = z.infer<typeof scaleStepSchema>
export type ChipsStep = z.infer<typeof chipsStepSchema>
export type FacesStep = z.infer<typeof facesStepSchema>
export type NotesPhotoStep = z.infer<typeof notesPhotoStepSchema>
export type NpsStep = z.infer<typeof npsStepSchema>
export type MultiSelectStep = z.infer<typeof multiSelectStepSchema>
export type TextStep = z.infer<typeof textStepSchema>
export type ReviewStep = z.infer<typeof reviewStepSchema>
export type ConfirmationStep = z.infer<typeof confirmationStepSchema>

export const flowSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  locale: z.string().default("it"),
  steps: z.array(stepSchema).min(1),
})

export type Flow = z.infer<typeof flowSchema>

export function parseFlow(input: unknown): Flow {
  return flowSchema.parse(input)
}
