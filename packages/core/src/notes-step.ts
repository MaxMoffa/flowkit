import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields } from "./schema"

export const notesStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("notes"),
  placeholder: z.string().optional(),
})

export type NotesStep = z.infer<typeof notesStepSchema>

registerStepType({
  type: "notes",
  schema: notesStepSchema,
  validate: (_step, value) => typeof value === "string" && value.trim().length > 0,
  getIssue: (_step, value) =>
    typeof value === "string" && value.trim().length > 0 ? null : { rule: "required" },
})
