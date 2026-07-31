import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields } from "./schema"

export const introStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("intro"),
  cta: z.string().default("Inizia"),
  livePill: z.string().optional(),
})

export type IntroStep = z.infer<typeof introStepSchema>

registerStepType({
  type: "intro",
  schema: introStepSchema,
  validate: () => true,
  role: "intro",
})
