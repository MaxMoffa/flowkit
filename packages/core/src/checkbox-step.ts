import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields } from "./schema"

/**
 * "checkbox" step: a single boolean toggle (e.g. privacy consent). The real "must be
 * accepted to proceed" gate comes from baseStepFields.required (default true), same as
 * every other step: isStepValid() (machine.ts) already skips validation entirely when
 * required:false, so this step's own validate() only runs when acceptance is mandatory.
 */
export const checkboxStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("checkbox"),
  label: z.string().min(1),
  description: z.string().optional(),
})

export type CheckboxStep = z.infer<typeof checkboxStepSchema>

registerStepType({
  type: "checkbox",
  schema: checkboxStepSchema,
  validate: (_step, value) => value === true,
  getIssue: (_step, value) => (value === true ? null : { rule: "required" }),
})
