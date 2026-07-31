import { z } from "zod"
import { registerStepType, getStepTypeDefinition } from "./registry"
import { baseStepFields, parseStep, type Step } from "./schema"
import { answerKey } from "./machine"

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
    ...baseStepFields,
    type: z.literal("group"),
    layout: z.enum(["stack", "columns"]).default("stack"),
    /**
     * Conditional advance logic (v2.25): which children gate the group's own
     * validity, and whether via AND ("all"), OR ("any"), or never ("none").
     * Unset = legacy behavior (every child validates per its own `required`
     * flag). When set, only the children listed in `ids` (all children if
     * `ids` omitted) participate — children outside `ids` never block
     * advancing, replacing rather than merging with their individual
     * `required` flag.
     */
    requiredChildren: z
      .object({
        mode: z.enum(["all", "any", "none"]).default("all"),
        ids: z.array(z.string()).optional(),
      })
      .optional(),
    steps: z.array(z.unknown()).min(1),
  })
  .transform((val) => ({ ...val, steps: val.steps.map(parseStep) }))

export type GroupStep = z.infer<typeof groupStepSchema> & { steps: Step[] }

function isChildValid(child: Step, aggregate: Record<string, unknown>): boolean {
  const def = getStepTypeDefinition(child.type)
  if (!def) return false
  return def.validate(child, aggregate[answerKey(child)], aggregate)
}

registerStepType({
  type: "group",
  schema: groupStepSchema,
  validate: (step, value) => {
    const groupStep = step as GroupStep
    const aggregate = (value ?? {}) as Record<string, unknown>
    const requiredChildren = groupStep.requiredChildren

    if (!requiredChildren) {
      return groupStep.steps.every((child) => {
        if ((child as { required?: boolean }).required === false) return true
        return isChildValid(child, aggregate)
      })
    }

    if (requiredChildren.mode === "none") return true

    const gatingChildren = requiredChildren.ids
      ? groupStep.steps.filter((child) => requiredChildren.ids!.includes(child.id))
      : groupStep.steps

    return requiredChildren.mode === "any"
      ? gatingChildren.some((child) => isChildValid(child, aggregate))
      : gatingChildren.every((child) => isChildValid(child, aggregate))
  },
})
