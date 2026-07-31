import { z } from "zod"
import { registerStepType } from "./registry"
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

registerStepType({
  type: "date-time",
  schema: dateTimeStepSchema,
  validate: (step, value) => {
    if (typeof value !== "string" || value.trim().length === 0) return false
    if (step.min && value < step.min) return false
    if (step.max && value > step.max) return false
    return true
  },
})
