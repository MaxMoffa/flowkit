import { z } from "zod"
import { registerStepType, type ValidationIssue } from "./registry"
import { baseStepFields, requireOptionsOrDataSource, optionsOrDataSourceIssue } from "./schema"
import { remoteDataSourceSchema } from "./remote-data-source"

export const selectCardsStepSchema = z
  .object({
    ...baseStepFields,
    type: z.literal("select-cards"),
    multiple: z.boolean().default(false),
    options: z
      .array(
        z.object({
          value: z.string(),
          label: z.string(),
          emoji: z.string().optional(),
          description: z.string().optional(),
        }),
      )
      .default([]),
    /** Remote data source (v2.30): fetches options instead of/alongside the static list. */
    dataSource: remoteDataSourceSchema.optional(),
  })
  .refine(requireOptionsOrDataSource, optionsOrDataSourceIssue)

export type SelectCardsStep = z.infer<typeof selectCardsStepSchema>

function selectCardsIssue(step: SelectCardsStep, value: unknown): ValidationIssue | null {
  const empty = step.multiple ? !Array.isArray(value) || value.length === 0 : typeof value !== "string" || value.length === 0
  return empty ? { rule: "required" } : null
}

registerStepType({
  type: "select-cards",
  schema: selectCardsStepSchema,
  validate: (step, value) => selectCardsIssue(step, value) === null,
  getIssue: (step, value) => selectCardsIssue(step, value),
})
