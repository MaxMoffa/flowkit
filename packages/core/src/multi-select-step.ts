import { z } from "zod"
import { registerStepType, type ValidationIssue } from "./registry"
import { baseStepFields, optionSchema, requireOptionsOrDataSource, optionsOrDataSourceIssue } from "./schema"
import { remoteDataSourceSchema } from "./remote-data-source"

export const multiSelectStepSchema = z
  .object({
    ...baseStepFields,
    type: z.literal("multi-select"),
    options: z.array(optionSchema).default([]),
    min: z.number().default(0),
    max: z.number().optional(),
    dataSource: remoteDataSourceSchema.optional(),
  })
  .refine(requireOptionsOrDataSource, optionsOrDataSourceIssue)

export type MultiSelectStep = z.infer<typeof multiSelectStepSchema>

function multiSelectIssue(step: MultiSelectStep, value: unknown): ValidationIssue | null {
  const arr = Array.isArray(value) ? value : []
  if (arr.length === 0 && step.min > 0) return { rule: "required" }
  if (arr.length < step.min) {
    return { rule: "tooFewOptions", params: { min: step.min, remaining: step.min - arr.length } }
  }
  if (step.max !== undefined && arr.length > step.max) {
    return { rule: "tooManyOptions", params: { max: step.max, excess: arr.length - step.max } }
  }
  return null
}

registerStepType({
  type: "multi-select",
  schema: multiSelectStepSchema,
  validate: (step, value) => multiSelectIssue(step, value) === null,
  getIssue: (step, value) => multiSelectIssue(step, value),
})
