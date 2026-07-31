import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields, requireOptionsOrDataSource, optionsOrDataSourceIssue } from "./schema"
import { remoteDataSourceSchema } from "./remote-data-source"

export const multiSelectStepSchema = z
  .object({
    ...baseStepFields,
    type: z.literal("multi-select"),
    options: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
    min: z.number().default(0),
    max: z.number().optional(),
    dataSource: remoteDataSourceSchema.optional(),
  })
  .refine(requireOptionsOrDataSource, optionsOrDataSourceIssue)

export type MultiSelectStep = z.infer<typeof multiSelectStepSchema>

registerStepType({
  type: "multi-select",
  schema: multiSelectStepSchema,
  validate: (step, value) => {
    const arr = Array.isArray(value) ? value : []
    if (arr.length < step.min) return false
    if (step.max !== undefined && arr.length > step.max) return false
    return step.min > 0 ? arr.length > 0 : true
  },
})
