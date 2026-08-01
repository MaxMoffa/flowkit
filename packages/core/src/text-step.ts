import { z } from "zod"
import { registerStepType, type ValidationIssue } from "./registry"
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
  /** Minimum/maximum trimmed character count, checked for "text"/"email" variants. */
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
  /** Minimum/maximum numeric value, checked for the "number" variant. */
  min: z.number().optional(),
  max: z.number().optional(),
})

export type TextStep = z.infer<typeof textStepSchema>

function textStepIssue(step: TextStep, value: unknown): ValidationIssue | null {
  if (typeof value !== "string" || value.trim().length === 0) return { rule: "required" }
  const trimmed = value.trim()

  if (step.variant === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { rule: "invalidFormat" }
  }
  if (step.variant === "number") {
    const n = Number(value)
    if (Number.isNaN(n)) return { rule: "invalidFormat" }
    if (step.min !== undefined && n < step.min) return { rule: "outOfRange", params: { min: step.min, max: step.max ?? "∞" } }
    if (step.max !== undefined && n > step.max) return { rule: "outOfRange", params: { min: step.min ?? "-∞", max: step.max } }
  }
  if (step.pattern && !new RegExp(step.pattern).test(value)) return { rule: "invalidFormat" }
  if (step.variant !== "number") {
    if (step.minLength !== undefined && trimmed.length < step.minLength) {
      return { rule: "minLength", params: { min: step.minLength, remaining: step.minLength - trimmed.length } }
    }
    if (step.maxLength !== undefined && trimmed.length > step.maxLength) {
      return { rule: "maxLength", params: { max: step.maxLength, excess: trimmed.length - step.maxLength } }
    }
  }
  return null
}

registerStepType({
  type: "text",
  schema: textStepSchema,
  validate: (step, value) => textStepIssue(step, value) === null,
  getIssue: (step, value) => textStepIssue(step, value),
})
