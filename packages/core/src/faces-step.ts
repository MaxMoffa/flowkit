import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields } from "./schema"

export const facesStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("faces"),
  faces: z
    .array(z.object({ value: z.string(), emoji: z.string(), label: z.string().optional() }))
    .min(2)
    .default([
      { value: "1", emoji: "😞", label: "Pessimo" },
      { value: "2", emoji: "🙁", label: "Scarso" },
      { value: "3", emoji: "😐", label: "Ok" },
      { value: "4", emoji: "🙂", label: "Buono" },
      { value: "5", emoji: "😄", label: "Ottimo" },
    ]),
})

export type FacesStep = z.infer<typeof facesStepSchema>

registerStepType({
  type: "faces",
  schema: facesStepSchema,
  validate: (_step, value) => typeof value === "string" && value.length > 0,
  getIssue: (_step, value) =>
    typeof value === "string" && value.length > 0 ? null : { rule: "required" },
})
