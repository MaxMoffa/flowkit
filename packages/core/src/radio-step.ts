import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields, optionSchema, requireOptionsOrDataSource, optionsOrDataSourceIssue } from "./schema"
import { remoteDataSourceSchema } from "./remote-data-source"

export const radioStepSchema = z
  .object({
    ...baseStepFields,
    type: z.literal("radio"),
    options: z.array(optionSchema).default([]),
    dataSource: remoteDataSourceSchema.optional(),
  })
  .refine(requireOptionsOrDataSource, optionsOrDataSourceIssue)

export type RadioStep = z.infer<typeof radioStepSchema>

registerStepType({
  type: "radio",
  schema: radioStepSchema,
  validate: (_step, value) => typeof value === "string" && value.length > 0,
  getIssue: (_step, value) =>
    typeof value === "string" && value.length > 0 ? null : { rule: "required" },
})
