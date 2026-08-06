import { z } from "zod"
import { registerStepType, type ValidationIssue } from "./registry"
import { baseStepFields, optionSchema, requireOptionsOrDataSource, optionsOrDataSourceIssue } from "./schema"
import { remoteDataSourceSchema } from "./remote-data-source"

export const chipsStepSchema = z
  .object({
    ...baseStepFields,
    type: z.literal("chips"),
    multiple: z.boolean().default(true),
    options: z.array(optionSchema).default([]),
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

function chipsIssue(step: ChipsStep, value: unknown): ValidationIssue | null {
  const empty = step.multiple ? !Array.isArray(value) || value.length === 0 : typeof value !== "string" || value.length === 0
  return empty ? { rule: "required" } : null
}

registerStepType({
  type: "chips",
  schema: chipsStepSchema,
  validate: (step, value) => chipsIssue(step, value) === null,
  getIssue: (step, value) => chipsIssue(step, value),
})
