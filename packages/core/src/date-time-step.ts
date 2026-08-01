import { z } from "zod"
import { registerStepType, type ValidationIssue } from "./registry"
import { baseStepFields } from "./schema"

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

export type DateTimeStep = z.infer<typeof dateTimeStepSchema>

function dateTimeStepIssue(step: DateTimeStep, value: unknown): ValidationIssue | null {
  if (typeof value !== "string" || value.trim().length === 0) return { rule: "required" }
  if ((step.min && value < step.min) || (step.max && value > step.max)) {
    return { rule: "invalidDate", params: { min: step.min ?? "-∞", max: step.max ?? "∞" } }
  }
  return null
}

registerStepType({
  type: "date-time",
  schema: dateTimeStepSchema,
  validate: (step, value) => dateTimeStepIssue(step, value) === null,
  getIssue: (step, value) => dateTimeStepIssue(step, value),
})
