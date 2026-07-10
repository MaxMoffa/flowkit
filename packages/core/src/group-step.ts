import { z } from "zod"
import { registerStepType, getStepTypeDefinition } from "./registry"
import { parseStep, type Step } from "./schema"

/**
 * "group" step (v2.14+): composes multiple steps into a single page, with no
 * navigation/validation of its own in the state machine — it counts as a
 * normal "leaf" flow step (no special `role`). Children's answers stay
 * nested under the group's id (Record<childId, value>), not flattened: this
 * avoids any change to canGoNext/progress/next/prev in machine.ts, because
 * the group's validate (below) already implements the required aggregation.
 */
export const groupStepSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("group"),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    required: z.boolean().default(true),
    icon: z.string().optional(),
    themeOverride: z.record(z.string(), z.unknown()).optional(),
    layout: z.enum(["stack", "columns"]).default("stack"),
    steps: z.array(z.unknown()).min(1),
  })
  .transform((val) => ({ ...val, steps: val.steps.map(parseStep) }))

export type GroupStep = z.infer<typeof groupStepSchema> & { steps: Step[] }

registerStepType({
  type: "group",
  schema: groupStepSchema,
  validate: (step, value) => {
    const groupStep = step as GroupStep
    const aggregate = (value ?? {}) as Record<string, unknown>
    return groupStep.steps.every((child) => {
      const def = getStepTypeDefinition(child.type)
      if (!def) return false
      if ((child as { required?: boolean }).required === false) return true
      return def.validate(child, aggregate[child.id], aggregate)
    })
  },
})
