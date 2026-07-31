import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields } from "./schema"

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

export type ScaleStep = z.infer<typeof scaleStepSchema>

registerStepType({
  type: "scale",
  schema: scaleStepSchema,
  validate: (_step, value) => typeof value === "number",
})
