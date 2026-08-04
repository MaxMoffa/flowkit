import type { Flow } from "./schema"
import { getStepTypeDefinition } from "./registry"
import { evaluateCondition, type BranchStep, type Condition } from "./branch-step"
import { answerKey, getCurrentStep, type FlowState } from "./flow-state"

/** Evaluates a "branch" step's rules against the current answers and returns the id of
 *  the step to jump to: the first matching rule's `goTo`, else `fallback`, else the
 *  natural next step in flow order. Pure — doesn't itself change state, see applyBranch. */
export function resolveBranch(flow: Flow, state: FlowState): string {
  const step = getCurrentStep(flow, state) as unknown as BranchStep
  for (const rule of step.rules) {
    if (evaluateCondition(rule.when, state.answers)) return rule.goTo
  }
  if (step.fallback) return step.fallback
  const nextStep = flow.steps[state.index + 1]
  return nextStep ? nextStep.id : step.id
}

/** Jumps to a branch's resolved target. Unlike next()/goToStep(), doesn't push the
 *  branch step onto history: it's never rendered, so there's nothing for Back to
 *  return to. */
export function applyBranch(flow: Flow, state: FlowState, targetStepId: string): FlowState {
  const index = flow.steps.findIndex((s) => s.id === targetStepId)
  if (index === -1) {
    throw new Error(`Flow "${flow.id}" has no step with id "${targetStepId}"`)
  }
  return { ...state, index }
}

function collectConditionKeys(condition: Condition, out: Set<string>): void {
  if ("all" in condition) {
    condition.all.forEach((c) => collectConditionKeys(c, out))
  } else if ("any" in condition) {
    condition.any.forEach((c) => collectConditionKeys(c, out))
  } else if ("not" in condition) {
    collectConditionKeys(condition.not, out)
  } else {
    out.add(condition.key)
  }
}

export interface ResolvedPath {
  /** Ids of non-intro/confirmation/logic steps from the start through confirmation, as
   *  far as they can be determined from the answers collected so far. */
  stepIds: string[]
  /** False when a "branch" step ahead can't yet be resolved (see resolveFlowPath) —
   *  `stepIds` then stops right before it, instead of reaching confirmation. */
  determinate: boolean
}

/**
 * Walks the flow from its first step, resolving each "branch" (role: "logic") step
 * along the way with the same `evaluateCondition` resolveBranch/applyBranch use, to
 * find the steps the *current* answers actually put on the path to confirmation —
 * unlike `flow.steps`, which lists every step regardless of whether a branch skips it.
 *
 * A branch can only be resolved once every field its rules reference has had the
 * chance to be answered for real: a rule referencing a step at an index beyond
 * `state.index` (not yet reached by the user) makes the whole path from that branch
 * onward `determinate: false` — resolving it now would be a guess that's likely to
 * flip once the user actually answers that field (imagine a nested branch: the
 * dependency step might itself be skipped by an earlier, still-unresolved branch).
 * A branch at or before `state.index` was necessarily already resolved for real (branch
 * steps are never rendered — FlowRunner jumps through them synchronously), so replaying
 * it here with the same answers reproduces that same jump deterministically, including
 * after the user goes back and changes the answer that drove it.
 */
export function resolveFlowPath(flow: Flow, state: FlowState): ResolvedPath {
  const indexByKey = new Map<string, number>()
  const indexById = new Map<string, number>()
  flow.steps.forEach((s, i) => {
    indexByKey.set(answerKey(s), i)
    indexById.set(s.id, i)
  })

  const stepIds: string[] = []
  const seenPositions = new Set<number>()
  let pos = 0

  while (pos < flow.steps.length) {
    if (seenPositions.has(pos)) return { stepIds, determinate: false }
    seenPositions.add(pos)

    const current = flow.steps[pos]!
    const def = getStepTypeDefinition(current.type)

    if (def?.role === "logic") {
      const branch = current as unknown as BranchStep
      const dependencyKeys = new Set<string>()
      for (const rule of branch.rules) collectConditionKeys(rule.when, dependencyKeys)

      const unresolvable = Array.from(dependencyKeys).some((key) => {
        const depIndex = indexByKey.get(key)
        return depIndex === undefined || depIndex > state.index
      })
      if (unresolvable) return { stepIds, determinate: false }

      let target: string | undefined
      for (const rule of branch.rules) {
        if (evaluateCondition(rule.when, state.answers)) {
          target = rule.goTo
          break
        }
      }
      target ??= branch.fallback
      if (!target) {
        const nextStep = flow.steps[pos + 1]
        target = nextStep ? nextStep.id : current.id
      }

      const targetIndex = indexById.get(target)
      if (targetIndex === undefined) return { stepIds, determinate: false }
      pos = targetIndex
      continue
    }

    if (def?.role !== "intro" && def?.role !== "confirmation") stepIds.push(current.id)
    if (def?.role === "confirmation") break
    pos += 1
  }

  return { stepIds, determinate: true }
}

export interface ProgressInfo {
  /** Position of the current step within the resolved path (0-based). */
  currentIndex: number
  /** Length of the resolved path, or null while it can't yet be fully determined. */
  total: number | null
  /** (currentIndex + 1) / total, or null when total is null. */
  pct: number | null
}

/** Branch-aware replacement for `progress`: derives the current step's position and
 *  the flow's total step count from the actually reachable path (see resolveFlowPath),
 *  not from `flow.steps.length`. */
export function getProgressInfo(flow: Flow, state: FlowState): ProgressInfo {
  const path = resolveFlowPath(flow, state)
  const step = getCurrentStep(flow, state)
  const foundIndex = path.stepIds.indexOf(step.id)
  const currentIndex = foundIndex === -1 ? 0 : foundIndex
  const total = path.determinate ? path.stepIds.length : null
  const pct = total !== null ? (currentIndex + 1) / total : null
  return { currentIndex, total, pct }
}

/** How a `CurrentStepInfo` event came about — see `getCurrentStepInfo`. `"branch-change"`
 *  is not a movement between steps (the step id can stay the same): it fires when an
 *  edited answer invalidates the downstream path the user had already walked, see
 *  `setAnswerAndInvalidateDownstream`. `"popstate"` is reserved for a future browser
 *  history integration — nothing in this package emits it yet. */
export type StepChangeDirection = "initial" | "next" | "prev" | "jump" | "popstate" | "branch-change"

/** Lightweight summary of a step, used for `CurrentStepInfo.previousStep` — deliberately
 *  without its own `previousStep`, so the payload doesn't nest indefinitely. */
export interface PreviousStepSummary {
  id: string
  type: string
  title: string | null
  /** Position within the resolved path at the time this step was current — see
   *  `CurrentStepInfo.index`. */
  index: number
}

/** Payload describing the step a `FlowRunner` integration is (or just became) showing.
 *  `index`/`total` refer to the resolved path (see `resolveFlowPath`/`getProgressInfo`):
 *  the steps actually reachable given the answers collected so far, not the full flow
 *  schema — `total` is `null` while that path can't yet be fully determined (an
 *  unresolved branch further ahead). A "logic" (branch) step never produces one of
 *  these: callers resolve it and only report the visible step it lands on. */
export interface CurrentStepInfo {
  id: string
  type: string
  title: string | null
  index: number
  total: number | null
  previousStep: PreviousStepSummary | null
  direction: StepChangeDirection
}

function toPreviousStepSummary(info: CurrentStepInfo): PreviousStepSummary {
  return { id: info.id, type: info.type, title: info.title, index: info.index }
}

/** Builds the `CurrentStepInfo` for `flow`'s current step in `state`. `direction`
 *  describes how this step became current (caller's responsibility — the engine itself
 *  doesn't know whether a transition was a "next" click, a review-row jump, etc.).
 *  `previousInfo` is the previously reported `CurrentStepInfo` (the return value of the
 *  prior call), or `null` for the very first call (mount) — carried forward as
 *  `previousStep` on the result, so consumers never need to track it themselves. */
export function getCurrentStepInfo(
  flow: Flow,
  state: FlowState,
  direction: StepChangeDirection,
  previousInfo: CurrentStepInfo | null,
): CurrentStepInfo {
  const step = getCurrentStep(flow, state)
  const progress = getProgressInfo(flow, state)
  return {
    id: step.id,
    type: step.type,
    title: (step as { title?: string }).title ?? null,
    index: progress.currentIndex,
    total: progress.total,
    previousStep: previousInfo ? toPreviousStepSummary(previousInfo) : null,
    direction,
  }
}

/** Whether `stepId` is reachable given `state` — on `resolveFlowPath`'s resolved path,
 *  or the trivially-always-reachable-at-index-0 "intro" step, or (once the whole path
 *  is determinate) the terminal "confirmation" step, which `resolveFlowPath.stepIds`
 *  excludes by design (see its role checks). Assumes a single confirmation-role step
 *  per flow, same invariant `isLastStep`/`ConfirmationFooter` already rely on. Unknown
 *  id, or a path that can't yet reach it, returns `false` — never throws. Used both by
 *  `computeInitialFlowState` (mount-time `initialStep`) and `FlowRunner`'s imperative
 *  `goToStep` (runtime jumps). */
export function isStepReachable(flow: Flow, state: FlowState, stepId: string): boolean {
  const index = flow.steps.findIndex((s) => s.id === stepId)
  if (index === -1) return false
  const def = getStepTypeDefinition(flow.steps[index]!.type)
  if (def?.role === "intro") return index === 0
  const path = resolveFlowPath(flow, state)
  if (def?.role === "confirmation") return path.determinate
  return path.stepIds.includes(stepId)
}
