import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields } from "./schema"

export const textStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("text"),
  variant: z.enum(["text", "number", "email"]).default("text"),
  placeholder: z.string().optional(),
  multiline: z.boolean().default(false),
  /** Regex (as a string, no flags) the value must fully match, checked in addition to
   *  the variant's own rule. E.g. an Italian fiscal code or a phone number shape. */
  pattern: z.string().optional(),
})

export type TextStep = z.infer<typeof textStepSchema>

registerStepType({
  type: "text",
  schema: textStepSchema,
  validate: (step, value) => {
    if (typeof value !== "string" || value.trim().length === 0) return false
    if (step.variant === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return false
    if (step.variant === "number" && Number.isNaN(Number(value))) return false
    if (step.pattern && !new RegExp(step.pattern).test(value)) return false
    return true
  },
})
