import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields } from "./schema"

export const npsStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("nps"),
  question: z.string().optional(),
})

export type NpsStep = z.infer<typeof npsStepSchema>

registerStepType({
  type: "nps",
  schema: npsStepSchema,
  validate: (_step, value) => typeof value === "number",
})
