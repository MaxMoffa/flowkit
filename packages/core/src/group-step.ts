import { z } from "zod"
import { registerStepType, getStepTypeDefinition } from "./registry"
import { baseStepFields, parseStep, type Step } from "./schema"
import { answerKey } from "./machine"
import { conditionSchema, evaluateCondition, type Condition } from "./branch-step"

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
    /**
     * Skip-if-false condition (v2.44), reusing the same `Condition` type/evaluator as
     * `branchRuleSchema.when` (branch-step.ts) — no new condition shape to learn. Unset
     * (default) = the group always runs, identical to every flow authored before this
     * field existed. When set and `evaluateCondition(when, answers)` is false, the whole
     * group — itself and every child in `steps` — is treated as absent everywhere the
     * flow is traversed (flow-path.ts's `resolveFlowPath`/`resolveBranch`, FlowRunner's
     * current-step resolution, `buildReportRows`): not the current step, not required,
     * not counted in progress, not in review/export. `false` always falls through to the
     * *next* step in the parent `steps[]` array — unlike `branch`, there is no separate
     * target to configure; that's the whole point of this being simpler than a branch.
     */
    when: conditionSchema.optional(),
    steps: z.array(z.unknown()).min(1),
  })
  .transform((val) => ({ ...val, steps: val.steps.map(parseStep) }))

export type GroupStep = z.infer<typeof groupStepSchema> & { steps: Step[] }

/** True for a "group" step whose `when` evaluates false against `answers` — see the
 *  field's doc comment above. Any other step (including a group with no `when`) is
 *  never skipped this way. Exported for @flowkit-io/react's GroupStepView (belt-and-
 *  suspenders null render, mirroring the "branch" step component's own). flow-path.ts
 *  keeps its own copy of this same check rather than importing it from here, to avoid
 *  a flow-path.ts <-> group-step.ts <-> machine.ts import cycle (this file already
 *  imports `answerKey` from the "./machine" barrel, which re-exports flow-path.ts). */
export function isGroupSkipped(step: Step, answers: Record<string, unknown>): boolean {
  if ((step.type as string) !== "group") return false
  const when = (step as unknown as { when?: Condition }).when
  return when !== undefined && !evaluateCondition(when, answers)
}

function isChildValid(child: Step, aggregate: Record<string, unknown>): boolean {
  const def = getStepTypeDefinition(child.type)
  if (!def) return false
  return def.validate(child, aggregate[answerKey(child)], aggregate)
}

registerStepType({
  type: "group",
  schema: groupStepSchema,
  validate: (step, value, answers) => {
    const groupStep = step as GroupStep
    const aggregate = (value ?? {}) as Record<string, unknown>
    const requiredChildren = groupStep.requiredChildren

    // A nested child that's itself a skipped group (`when` false) is excluded outright
    // rather than treated as vacuously valid: in "any" mode a skipped child must not be
    // able to satisfy the requirement on its own (see isGroupSkipped's doc comment).
    // `when` is always evaluated against the flow-level flat `answers` — same as a
    // top-level group's own (flow-path.ts) — not the parent's nested `aggregate`, so a
    // nested group's condition means the same thing wherever it sits in the tree.
    const liveChildren = groupStep.steps.filter((child) => !isGroupSkipped(child, answers ?? {}))

    if (!requiredChildren) {
      return liveChildren.every((child) => {
        if ((child as { required?: boolean }).required === false) return true
        return isChildValid(child, aggregate)
      })
    }

    if (requiredChildren.mode === "none") return true

    const gatingChildren = requiredChildren.ids
      ? liveChildren.filter((child) => requiredChildren.ids!.includes(child.id))
      : liveChildren

    return requiredChildren.mode === "any"
      ? gatingChildren.some((child) => isChildValid(child, aggregate))
      : gatingChildren.every((child) => isChildValid(child, aggregate))
  },
})
