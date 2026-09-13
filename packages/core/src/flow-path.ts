import type { Flow, Step, ContentText } from "./schema"
import { getStepTypeDefinition } from "./registry"
import { evaluateCondition, type BranchStep, type Condition } from "./branch-step"
import { answerKey, getCurrentStep, type Answers, type FlowState } from "./flow-state"
import { resolveContentText } from "./i18n"

function isLogicStep(step: Step): boolean {
  return getStepTypeDefinition(step.type)?.role === "logic"
}

/** True for a "group" step whose `when` evaluates false against `answers` (skip-if-
 *  false groups, v2.44) — duplicated from group-step.ts's own `isGroupSkipped` rather
 *  than imported, to avoid a flow-path.ts <-> group-step.ts <-> machine.ts import cycle
 *  (group-step.ts imports `answerKey` from the "./machine" barrel, which re-exports
 *  this file). Keep the two in sync. */
function isGroupSkipped(step: Step, answers: Record<string, unknown>): boolean {
  if ((step.type as string) !== "group") return false
  const when = (step as unknown as { when?: Condition }).when
  return when !== undefined && !evaluateCondition(when, answers)
}

/** A step that navigation must act as though doesn't exist: a "logic" (branch) step,
 *  always, or a "group" step whose `when` currently evaluates false. Generic over any
 *  step list (not just a top-level `flow.steps`) — also the "hidden" check a `subflow`
 *  step's own internal navigation uses for its children (see subflow-step.ts). */
export function isHidden(step: Step, answers: Answers): boolean {
  return isLogicStep(step) || isGroupSkipped(step, answers)
}

/** Index of the first step that can actually be rendered from `from` onwards, falling
 *  back to the closest one *before* it — the escape hatch for a branch that resolves
 *  nowhere renderable (cycle, or a target past the end of the list), or for a skipped
 *  group with nothing after it. `-1` only for the degenerate case of nothing but hidden
 *  steps. Generic over any step list, same reason as `isHidden`. */
export function firstVisibleIndex(steps: Step[], from: number, answers: Answers): number {
  for (let i = Math.max(from, 0); i < steps.length; i += 1) {
    if (!isHidden(steps[i]!, answers)) return i
  }
  for (let i = Math.min(from, steps.length) - 1; i >= 0; i -= 1) {
    if (!isHidden(steps[i]!, answers)) return i
  }
  return -1
}

/** Resolves one "branch" step to the *index* of its target: the first matching rule's
 *  `goTo`, else `fallback`, else the natural next step in list order (which may be one
 *  past the last step — callers handle that). Shared by `resolveBranch` (runtime jump)
 *  and `walkStepPath` (path/progress), so the two can never disagree on where a branch
 *  leads. Generic over any step list via `indexById` — same reason as `isHidden`.
 *
 *  A `goTo`/`fallback` naming a step that doesn't exist (a config typo — nothing
 *  validates these ids at parse time) is skipped rather than honored: the flow degrades
 *  to the next candidate and ultimately to the natural next step, instead of dead-ending
 *  on a target that can't be reached. */
function resolveBranchTargetIndex(
  branch: BranchStep,
  pos: number,
  answers: Answers,
  indexById: Map<string, number>,
): number {
  let matched: string | undefined
  for (const rule of branch.rules) {
    if (evaluateCondition(rule.when, answers)) {
      matched = rule.goTo
      break
    }
  }
  for (const candidate of [matched, branch.fallback]) {
    if (candidate === undefined) continue
    const index = indexById.get(candidate)
    if (index !== undefined) return index
  }
  return pos + 1
}

/** Generic over any step list — same reason as `isHidden`. */
export function buildIndexById(steps: Step[]): Map<string, number> {
  return new Map(steps.map((s, i) => [s.id, i] as const))
}

/** Generic, list-level version of `resolveBranch`'s own jump-through-hidden-steps loop:
 *  resolves `fromIndex` past any hidden step (a "branch"/logic step, or a skipped
 *  "group"), following branch targets and falling back to the closest visible step when
 *  nothing renderable is reachable. Used both by `resolveBranch` (top-level flow) and by
 *  a `subflow` step's own internal navigation (subflow-step.ts) — a subflow behaves as a
 *  fully self-contained mini flow, including how it jumps through invisible children.
 *  Chained hidden steps are followed through exactly as `resolveBranch` documents;
 *  returns `fromIndex` unchanged when it's already visible, and a valid, visible index
 *  otherwise (never -1: falls back to `fromIndex` itself for the degenerate case of
 *  nothing but hidden steps, same escape hatch `resolveBranch` has always had). */
export function resolveVisibleIndex(steps: Step[], fromIndex: number, answers: Answers): number {
  if (fromIndex < 0 || fromIndex >= steps.length) return fromIndex
  if (!isHidden(steps[fromIndex]!, answers)) return fromIndex

  const indexById = buildIndexById(steps)
  const seen = new Set<number>()
  let pos = fromIndex
  while (pos >= 0 && pos < steps.length && isHidden(steps[pos]!, answers) && !seen.has(pos)) {
    seen.add(pos)
    const step = steps[pos]!
    pos = isLogicStep(step) ? resolveBranchTargetIndex(step as unknown as BranchStep, pos, answers, indexById) : pos + 1
  }
  if (pos >= 0 && pos < steps.length && !isHidden(steps[pos]!, answers)) return pos

  const escape = firstVisibleIndex(steps, fromIndex + 1, answers)
  return escape === -1 ? fromIndex : escape
}

/** Resolves the step the state is currently on, when it's one FlowRunner must jump past
 *  without ever rendering, to the id of the step to actually land on: for a "branch"
 *  (role: "logic") step, the first matching rule's `goTo`, else `fallback`, else the
 *  natural next step in flow order; for a skipped "group" (`when` evaluates false, see
 *  group-step.ts), always just the natural next step, since a group has no goTo/fallback
 *  to configure. Pure — doesn't itself change state, see applyBranch.
 *
 *  Chained hidden steps (a branch whose target is another branch, or a skipped group
 *  immediately followed by another, in any mix) are followed through to the first step
 *  that can actually be rendered, so the returned id is always a real, visible step: a
 *  caller can jump to it in one move, and a config whose branches loop back onto each
 *  other degrades to the nearest renderable step instead of spinning forever
 *  (`FlowRunner` resolves this in an effect — a cycle there would be an infinite render
 *  loop). Called on an already-visible step, returns that step's own id. */
export function resolveBranch(flow: Flow, state: FlowState): string {
  const resolvedIndex = resolveVisibleIndex(flow.steps, state.index, state.answers)
  return flow.steps[resolvedIndex]!.id
}

/** Whether the state's current step must never actually render: a "branch" (role:
 *  "logic") step, or a "group" step whose `when` evaluates false. `FlowRunner` gates its
 *  resolve-and-jump effect (`resolveBranch` + `applyBranch`) on this instead of the old
 *  `stepRole === "logic"` check alone, so a skipped group is jumped past the same way a
 *  branch always has been. */
export function isCurrentStepSkipped(flow: Flow, state: FlowState): boolean {
  return isHidden(getCurrentStep(flow, state), state.answers)
}

/** Jumps to a branch's (or a skipped group's) resolved target. Unlike next()/goToStep(),
 *  doesn't push the source step onto history: it's never rendered, so there's nothing
 *  for Back to return to. */
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
 * chance to be answered for real: a rule referencing a step that is both beyond
 * `state.index` (not yet reached by the user) and still unanswered makes the whole path
 * from that branch onward `determinate: false` — resolving it now would be a guess
 * that's likely to flip once the user actually answers that field (imagine a nested
 * branch: the dependency step might itself be skipped by an earlier, still-unresolved
 * branch). An answer that's already there is *not* a guess, even when it belongs to a
 * step further down the flow: that's the user having gone back to edit an earlier step
 * (the whole path is still known, and blanking the total behind them would be a visible
 * regression), or a resumed session's preloaded answers.
 * A branch at or before `state.index` was necessarily already resolved for real (branch
 * steps are never rendered — FlowRunner jumps through them synchronously), so replaying
 * it here with the same answers reproduces that same jump deterministically, including
 * after the user goes back and changes the answer that drove it.
 *
 * A key no top-level step can ever produce (a typo, or a `group` child's key — those
 * live nested inside the group's own aggregate value, not flat in `answers`) never
 * blocks resolution: it evaluates the same way now and forever, and the runtime jump
 * (`resolveBranch`) doesn't wait for it either — the path must mirror what navigation
 * actually does, not be more conservative than it.
 */
/**
 * Generic, list-level version of `resolveFlowPath`'s own walk: resolves every "branch"
 * step from `fromIndex` onward with `evaluateCondition`, the same way `resolveVisibleIndex`
 * does for a single jump. Used both by `resolveFlowPath` (top-level flow) and by a
 * `subflow` step's own internal progress (subflow-step.ts).
 */
export function walkStepPath(steps: Step[], answers: Answers, fromIndex: number): ResolvedPath {
  const indexByKey = new Map<string, number>()
  const indexById = buildIndexById(steps)
  steps.forEach((s, i) => {
    indexByKey.set(answerKey(s), i)
    // A group's children answer into the same flat key namespace as top-level steps
    // (resolveStepKeys enforces flow-wide uniqueness across both), but are only ever
    // filled in when the group step itself is reached — so they gate a branch at the
    // group's own position.
    const children = (s as { steps?: Step[] }).steps
    if (Array.isArray(children)) children.forEach((child) => indexByKey.set(answerKey(child), i))
  })

  const stepIds: string[] = []
  const seenPositions = new Set<number>()
  let pos = 0

  while (pos < steps.length) {
    if (seenPositions.has(pos)) return { stepIds, determinate: false }
    seenPositions.add(pos)

    const current = steps[pos]!
    const def = getStepTypeDefinition(current.type)

    if (def?.role === "logic") {
      const branch = current as unknown as BranchStep
      const dependencyKeys = new Set<string>()
      for (const rule of branch.rules) collectConditionKeys(rule.when, dependencyKeys)

      const unresolvable = Array.from(dependencyKeys).some((key) => {
        const depIndex = indexByKey.get(key)
        return depIndex !== undefined && depIndex > fromIndex && !(key in answers)
      })
      if (unresolvable) return { stepIds, determinate: false }

      pos = resolveBranchTargetIndex(branch, pos, answers, indexById)
      continue
    }

    // A skipped group (`when` evaluates false) always falls through to the very next
    // position — unlike a branch, it has no goTo/fallback of its own to resolve, and
    // (unlike a branch dependency) its own `when` is evaluated with the answers on hand
    // right now: it's not gated on "has the flow reached this position yet", since the
    // group itself is what would be reached.
    if (isGroupSkipped(current, answers)) {
      pos += 1
      continue
    }

    if (def?.role !== "intro" && def?.role !== "confirmation") stepIds.push(current.id)
    if (def?.role === "confirmation") break
    pos += 1
  }

  return { stepIds, determinate: true }
}

export function resolveFlowPath(flow: Flow, state: FlowState): ResolvedPath {
  return walkStepPath(flow.steps, state.answers, state.index)
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

export interface ProgressSegment {
  /** `null` groups a run of consecutive path steps that don't join any section — a
   *  segmented progress-bar renderer draws it as a plain (untinted) part of the bar. */
  sectionId: string | null
  /** Index within the resolved path (`ResolvedPath.stepIds`) this segment starts at. */
  startIndex: number
  length: number
}

/**
 * Branch-aware, per-`sectionId` grouping (v2.4x "section" primitive) of the resolved
 * path (see `resolveFlowPath`) into consecutive runs of the same `sectionId` — the same
 * path `getProgressInfo` derives `total`/`currentIndex` from, just split wherever the
 * section changes. `null` while the path isn't fully determined yet (mirrors
 * `ResolvedPath.determinate`).
 *
 * A flow with no `sections` (or none of whose steps set `sectionId`) always resolves to
 * exactly one segment (`sectionId: null`) spanning the whole path — the same shape a
 * segmented progress-bar renderer gets for a flow that *does* use sections, so it never
 * needs to special-case "no sections" as a separate code path.
 */
export function getSectionSegments(flow: Flow, state: FlowState): ProgressSegment[] | null {
  const path = resolveFlowPath(flow, state)
  if (!path.determinate) return null
  const indexById = buildIndexById(flow.steps)
  const segments: ProgressSegment[] = []
  path.stepIds.forEach((id, i) => {
    const step = flow.steps[indexById.get(id)!]!
    const sectionId = (step as { sectionId?: string }).sectionId ?? null
    const last = segments[segments.length - 1]
    if (last && last.sectionId === sectionId) last.length += 1
    else segments.push({ sectionId, startIndex: i, length: 1 })
  })
  return segments
}

/** The `sectionId` of the flow's current step (`baseStepFields.sectionId`), or `null`
 *  when unset. FlowRunner's section banner is keyed off this, not the step id, so it
 *  persists across consecutive steps in the same section instead of remounting. */
export function getCurrentSectionId(flow: Flow, state: FlowState): string | null {
  const step = getCurrentStep(flow, state)
  return (step as { sectionId?: string }).sectionId ?? null
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
  const rawTitle = (step as { title?: ContentText }).title
  return {
    id: step.id,
    type: step.type,
    title: rawTitle !== undefined ? resolveContentText(flow, rawTitle) : null,
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
