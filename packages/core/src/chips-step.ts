import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields, requireOptionsOrDataSource, optionsOrDataSourceIssue } from "./schema"
import { remoteDataSourceSchema } from "./remote-data-source"

export const chipsStepSchema = z
  .object({
    ...baseStepFields,
    type: z.literal("chips"),
    multiple: z.boolean().default(true),
    options: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
    dataSource: remoteDataSourceSchema.optional(),
  })
  .refine(requireOptionsOrDataSource, optionsOrDataSourceIssue)

export type ChipsStep = z.infer<typeof chipsStepSchema>

export const durationChipValues = [
  "< 5 min",
  "5–30 min",
  "> 30 min",
  "Persistente",
] as const

registerStepType({
  type: "chips",
  schema: chipsStepSchema,
  validate: (step, value) => {
    if (step.multiple) return Array.isArray(value) && value.length > 0
    return typeof value === "string" && value.length > 0
  },
})
