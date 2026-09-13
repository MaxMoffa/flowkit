import { z } from "zod"
import { registerStepType, getStepTypeDefinition } from "./registry"
import { baseStepFields, parseStep, type Step } from "./schema"
import { answerKey, type Answers } from "./machine"
import { isGroupSkipped, requiredChildrenSchema } from "./group-step"
import { isHidden, resolveVisibleIndex, walkStepPath, type ResolvedPath } from "./flow-path"

/**
 * "subflow" step (v2.4x): a step that behaves as a fully self-contained mini flow —
 * its own children render one at a time, with their own internal next/prev navigation
 * and progress, not fused onto a single page like `group`. Answers still aggregate
 * under the subflow's own id (`Record<childId, value>`, resolved recursively — same
 * nested pattern as `group`), and children can be arbitrary step types, including
 * nested `group`/`branch`/section-tagged steps, or another `subflow`.
 *
 * Deliberately "inline config only": `steps` is a plain, already-embedded step list,
 * the same as `group.steps` — there's no notion of referencing an external flow by id
 * here. A consumer that wants to compose a subflow from a separately-authored/versioned
 * flow config is expected to resolve "which flow version" and inline its `steps` before
 * handing the config to `parseFlow` — that resolution is deliberately outside this
 * library's scope.
 */
export const subflowStepSchema = z
  .object({
    ...baseStepFields,
    type: z.literal("subflow"),
    requiredChildren: requiredChildrenSchema.optional(),
    steps: z.array(z.unknown()).min(1),
  })
  .transform((val) => ({ ...val, steps: val.steps.map(parseStep) }))

/** Not part of `StepTypeMap` (same reason `GroupStep` isn't — typing `steps: Step[]`
 *  there would close a cycle with `Step` itself). */
export type SubflowStep = z.infer<typeof subflowStepSchema> & { steps: Step[] }

function isSubflowChildValid(child: Step, aggregate: Record<string, unknown>): boolean {
  const def = getStepTypeDefinition(child.type)
  if (!def) return false
  return def.validate(child, aggregate[answerKey(child)], aggregate)
}

registerStepType({
  type: "subflow",
  schema: subflowStepSchema,
  validate: (step, value, answers) => {
    const subflowStep = step as SubflowStep
    const aggregate = (value ?? {}) as Record<string, unknown>
    const requiredChildren = subflowStep.requiredChildren

    // Excludes a skipped `group` child (`when` false, same as `group`'s own validate)
    // AND any `branch`/logic-role child: unlike `group`, a subflow's children have a
    // real, meaningful internal navigation (see resolveSubflowIndex below), so a nested
    // `branch` is a genuine routing hop, never user-answerable — its own `validate`
    // always returns true, which would otherwise let it satisfy "any" mode on its own.
    const liveChildren = subflowStep.steps.filter(
      (child) => !isGroupSkipped(child, answers ?? {}) && getStepTypeDefinition(child.type)?.role !== "logic",
    )

    if (!requiredChildren) {
      return liveChildren.every((child) => {
        if ((child as { required?: boolean }).required === false) return true
        return isSubflowChildValid(child, aggregate)
      })
    }

    if (requiredChildren.mode === "none") return true

    const gatingChildren = requiredChildren.ids
      ? liveChildren.filter((child) => requiredChildren.ids!.includes(child.id))
      : liveChildren

    return requiredChildren.mode === "any"
      ? gatingChildren.some((child) => isSubflowChildValid(child, aggregate))
      : gatingChildren.every((child) => isSubflowChildValid(child, aggregate))
  },
})

/** A `subflow` step's own internal navigation position — persisted in the step's
 *  `meta` (`onMetaChange`, same channel `group` uses for its children's own meta), not
 *  in its answer `value`: `value` stays a pure `Record<childId, value>` aggregate, same
 *  shape a `group` produces, regardless of which child the visitor currently has open. */
export interface SubflowNavState {
  index: number
  history: number[]
}

export const initialSubflowNav: SubflowNavState = { index: 0, history: [] }

/** Resolves `nav.index` past any hidden child (a nested `branch`/skipped `group`) —
 *  the exact same jump-through-hidden-steps behavior the top-level flow's own
 *  `resolveBranch` has, applied to this subflow's own children instead of `flow.steps`.
 *  `answers` is the flow's flat answers (not this subflow's own nested aggregate): a
 *  nested `branch`/`group.when` condition means the same thing wherever it sits in the
 *  tree, the same choice `group`'s own skip-if-false children already make. */
export function resolveSubflowIndex(step: SubflowStep, nav: SubflowNavState, answers: Answers): number {
  return resolveVisibleIndex(step.steps, nav.index, answers)
}

/** The subflow's own resolved path/progress (mirrors `resolveFlowPath`/`getProgressInfo`
 *  at the top level) — always walked from its first child, same as a real flow always
 *  starts counting progress from its own first step. */
export function getSubflowPath(step: SubflowStep, nav: SubflowNavState, answers: Answers): ResolvedPath {
  return walkStepPath(step.steps, answers, resolveSubflowIndex(step, nav, answers))
}

/** `{ currentIndex, total }` for the subflow's own internal progress indicator —
 *  `total` is `null` while a branch ahead can't yet be resolved, same meaning
 *  `getProgressInfo`'s `total` has for the top-level flow. */
export function getSubflowProgress(
  step: SubflowStep,
  nav: SubflowNavState,
  answers: Answers,
): { currentIndex: number; total: number | null } {
  const resolvedIndex = resolveSubflowIndex(step, nav, answers)
  const current = step.steps[resolvedIndex]
  const path = getSubflowPath(step, nav, answers)
  const foundIndex = current ? path.stepIds.indexOf(current.id) : -1
  const currentIndex = foundIndex === -1 ? 0 : foundIndex
  const total = path.determinate ? path.stepIds.length : null
  return { currentIndex, total }
}

/** True once the subflow's own navigation has moved past its last child — the signal
 *  its internal "Continua" reached the end, same meaning `isLastStep`/reaching
 *  confirmation has for the top-level flow. Doesn't imply every child is *valid*, only
 *  that there's nothing left to navigate to — validity is `subflowStepSchema`'s
 *  registered `validate` (above), which the outer flow already gates its own
 *  "Continua" on regardless of internal nav position. */
export function isSubflowDone(step: SubflowStep, nav: SubflowNavState, answers: Answers): boolean {
  return resolveSubflowIndex(step, nav, answers) >= step.steps.length
}

/** Advances past the subflow's current (resolved) child, but only if that child is
 *  itself valid right now — same gate the top-level flow's own `next()` applies via
 *  `isStepValid`. `aggregate` is this subflow's own nested `Record<childId, value>`
 *  (the current child's *own* validate reads its answer from there), while `answers`
 *  is the flow's flat answers (only used to resolve which child is actually current —
 *  see `resolveSubflowIndex`). Returns `nav` unchanged when the current child isn't
 *  valid yet, or there's nothing left to advance past. */
export function subflowNext(
  step: SubflowStep,
  nav: SubflowNavState,
  answers: Answers,
  aggregate: Record<string, unknown>,
): SubflowNavState {
  const index = resolveSubflowIndex(step, nav, answers)
  const current = step.steps[index]
  if (!current) return nav
  const def = getStepTypeDefinition(current.type)
  const valid = def ? def.validate(current, aggregate[answerKey(current)], aggregate) : false
  if (!valid) return nav
  return { index: index + 1, history: [...nav.history, index] }
}

/** Undoes the subflow's last internal `subflowNext` — same "pop history, land on the
 *  step that push came from" shape the top-level flow's own `prev()` has. A no-op at
 *  the subflow's own first child (nothing to go back to inside it — the outer flow's
 *  own Back button is what leaves the subflow entirely). */
export function subflowPrev(nav: SubflowNavState): SubflowNavState {
  if (nav.history.length === 0) return nav
  const target = nav.history[nav.history.length - 1]!
  return { index: target, history: nav.history.slice(0, -1) }
}

// Re-exported for @flowkit-io/react (SubflowStepView) without a second import of
// flow-path.ts's generic helpers.
export { isHidden as isSubflowChildHidden }
