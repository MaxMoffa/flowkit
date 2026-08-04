import type { Flow, Step } from "./schema"
import { getStepTypeDefinition, type ValidationIssue } from "./registry"
import { evaluateCondition, type BranchStep, type Condition } from "./branch-step"

export interface OAuthResult {
  providerId: string
  code?: string
  token?: string
  state?: string
  /** true if the user chose to proceed without authenticating (see oauthStepSchema.allowAnonymous). */
  anonymous?: boolean
}

export type AnswerValue =
  | string
  | number
  | boolean
  | string[]
  | OAuthResult
  | { lat?: number; lng?: number; address?: string; regionId?: string; pointId?: string }
  | Record<string, unknown>
  | null

export type Answers = Record<string, AnswerValue>

/** Field name a step's answer is stored under: its resolved `key` (see
 *  `resolveStepKeys`, schema.ts) when present, else its `id` — the fallback covers
 *  steps parsed outside `parseFlow` (e.g. `schema.parse()` called directly in a
 *  test), which never go through key resolution. */
export function answerKey(step: Step): string {
  // Cast: `key` comes from baseStepFields, not guaranteed on a consumer's custom step
  // type (see the identical cast/rationale on `defaultIcon`, report.ts).
  return (step as { key?: string }).key ?? step.id
}

export interface FlowState {
  index: number
  answers: Answers
  /**
   * Per-step bag for state that isn't itself the step's answer (e.g. the "smartFill"
   * add-on's "user overrode the suggestion" flag). Keyed by step id, opaque to the
   * engine. Lives here (not in component-local state) so it survives the step
   * component unmounting on navigation, and resets naturally on flow restart.
   */
  meta: Record<string, Record<string, unknown>>
  /**
   * Stack of step ids actually visited, in traversal order — the real path, not
   * `index - 1`. Needed once a "branch" step can skip indices going forward: `prev()`
   * pops this instead of blindly stepping back one index, so Back follows the path the
   * user actually took. `next()`/`goToStep()` push onto it; `applyBranch()` doesn't
   * (the branch step itself is never "visited" — it's never rendered).
   */
  history: string[]
}

export function createFlowState(): FlowState {
  return { index: 0, answers: {}, meta: {}, history: [] }
}

/** Merges a patch into a step's meta bag, leaving other steps' meta untouched. */
export function setStepMeta(state: FlowState, stepId: string, patch: Record<string, unknown>): FlowState {
  return {
    ...state,
    meta: { ...state.meta, [stepId]: { ...state.meta[stepId], ...patch } },
  }
}

export function getStepMeta(state: FlowState, stepId: string): Record<string, unknown> {
  return state.meta[stepId] ?? {}
}

export function getCurrentStep(flow: Flow, state: FlowState): Step {
  const step = flow.steps[state.index]
  if (!step) {
    throw new Error(`Flow "${flow.id}" has no step at index ${state.index}`)
  }
  return step
}

export function isLastStep(flow: Flow, state: FlowState): boolean {
  return state.index === flow.steps.length - 1
}

export function isFirstStep(state: FlowState): boolean {
  return state.index === 0
}

/** Returns true if the answer satisfies the step's minimum constraints. `meta` is the
 *  step's own meta bag (see FlowState.meta) — used by types that gate on ephemeral,
 *  non-answer state (e.g. "long-content"'s requireScrollToEnd). */
export function isStepValid(step: Step, answers: Answers, meta: Record<string, unknown> = {}): boolean {
  if (step.required === false) return true

  const value = answers[answerKey(step)]
  const def = getStepTypeDefinition(step.type)
  // No validation registered for this type: passes (permissive default behavior).
  if (!def) return true
  return def.validate(step, value, answers, meta)
}

/** Display-only counterpart of `isStepValid`: returns the specific rule that failed
 *  instead of a plain boolean, for field-anchored error messages. Deliberately *not*
 *  the same gate as `isStepValid` — `required: false` still fully bypasses navigation
 *  gating there, but here it only suppresses the "required" rule (empty is fine on an
 *  optional field), letting other rules (format, length, range, …) still surface a
 *  message when the user did type something invalid into an optional field.
 *
 *  Takes `value` directly rather than looking it up in `answers` itself: a "group"
 *  child's own value lives in the group's nested aggregate (see group-step.ts), not
 *  under its key in the flat flow-level `answers` a step component receives — reading
 *  `answers[answerKey(step)]` here would silently see `undefined` for every group child
 *  regardless of what's actually selected. `answers`/`meta` are still passed through
 *  as-is, for any custom step type's `getIssue` that cross-references other fields. */
export function getValidationIssueForValue(
  step: Step,
  value: unknown,
  answers: Answers,
  meta: Record<string, unknown> = {},
): ValidationIssue | null {
  const def = getStepTypeDefinition(step.type)
  if (!def) return null

  const issue = def.getIssue
    ? def.getIssue(step, value, answers, meta)
    : def.validate(step, value, answers, meta)
      ? null
      : { rule: "required" as const }

  if (step.required === false && issue?.rule === "required") return null
  return issue
}

/** `getValidationIssueForValue` for a top-level step, whose own value *is* under its
 *  key in `answers` (state.answers) — see that function for why a group child can't
 *  use this shortcut. */
export function getStepValidationIssue(
  step: Step,
  answers: Answers,
  meta: Record<string, unknown> = {},
): ValidationIssue | null {
  return getValidationIssueForValue(step, answers[answerKey(step)], answers, meta)
}

export function setAnswer(state: FlowState, step: Step, value: AnswerValue): FlowState {
  return { ...state, answers: { ...state.answers, [answerKey(step)]: value } }
}

export function next(flow: Flow, state: FlowState): FlowState {
  const step = getCurrentStep(flow, state)
  if (!isStepValid(step, state.answers, getStepMeta(state, step.id))) return state
  if (isLastStep(flow, state)) return state
  return { ...state, index: state.index + 1, history: [...state.history, step.id] }
}

export function prev(flow: Flow, state: FlowState): FlowState {
  if (flow.disableBack || state.history.length === 0) return state
  const targetId = state.history[state.history.length - 1]!
  const index = flow.steps.findIndex((s) => s.id === targetId)
  if (index === -1) return state
  return { ...state, index, history: state.history.slice(0, -1) }
}

/** Whether the "Indietro" affordance (button, review shortcuts) should be available:
 *  false with nothing to go back to (regardless of index — a step can be reached at
 *  index 0 without history only via createFlowState/restart), and always false when
 *  the flow is forward-only. */
export function canGoBack(flow: Flow, state: FlowState): boolean {
  return !flow.disableBack && state.history.length > 0
}

/** Jumps directly to a step by id (unlike next/prev, which move ±1). Used to let a
 *  clickable review row navigate straight to the step that produced an answer. Pushes
 *  the current step onto history, same as next(), so a subsequent prev() (e.g. the
 *  user backs out of the step they jumped to edit) returns to where they jumped from. */
export function goToStep(flow: Flow, state: FlowState, stepId: string): FlowState {
  const index = flow.steps.findIndex((s) => s.id === stepId)
  if (index === -1) {
    throw new Error(`Flow "${flow.id}" has no step with id "${stepId}"`)
  }
  const current = getCurrentStep(flow, state)
  return { ...state, index, history: [...state.history, current.id] }
}

export function canGoNext(flow: Flow, state: FlowState): boolean {
  const step = getCurrentStep(flow, state)
  return isStepValid(step, state.answers, getStepMeta(state, step.id))
}

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

/** @deprecated Counts every step declared in the flow, including ones a branch will
 *  skip — use `getProgressInfo` (branch-aware) instead. Kept for backward compatibility. */
export function progress(flow: Flow, state: FlowState): number {
  return (state.index + 1) / flow.steps.length
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

/** Keeps only the entries of `rawAnswers` that belong to a real step (matched by
 *  `answerKey`) and pass that step's own validation rule — the same `validate`
 *  function `isStepValid` uses (there's no zod schema for an answer *value*, only for
 *  a step's own config). Unknown keys and values that fail validation are dropped
 *  silently, never throw. Used by `computeInitialFlowState` (`initialAnswers`) and
 *  `FlowRunner`'s imperative `setAnswers`. */
export function filterValidAnswers(flow: Flow, rawAnswers: Answers): Answers {
  const byKey = new Map(flow.steps.map((s) => [answerKey(s), s] as const))
  const result: Answers = {}
  for (const [key, value] of Object.entries(rawAnswers)) {
    const step = byKey.get(key)
    if (!step) continue
    const def = getStepTypeDefinition(step.type)
    if (def && !def.validate(step, value, rawAnswers, {})) continue
    result[key] = value
  }
  return result
}

/** Options for `computeInitialFlowState` — how a `FlowRunner` should seed its very
 *  first `FlowState`, e.g. to resume a flow after a page refresh. */
export interface InitialFlowStateOptions {
  /** Id of the step to start on instead of the first step. Silently falls back to the
   *  normal initial step (index 0) if the id doesn't exist, or isn't reachable given
   *  `initialAnswers` — never throws. */
  initialStepId?: string
  /** Answers to preload before the flow ever renders. Filtered through
   *  `filterValidAnswers` first. */
  initialAnswers?: Answers
}

/** Builds the `FlowState` a `FlowRunner` should start from, honoring `initialStepId`/
 *  `initialAnswers` (see `InitialFlowStateOptions`) instead of always starting blank at
 *  index 0. Reachability of `initialStepId` is probed with `state.index` pinned to the
 *  last step: this is a fresh seed with no "current position" of its own yet, so a
 *  branch shouldn't be rejected merely for depending on a field the (nonexistent) prior
 *  session "hadn't reached" — every preloaded answer counts as already given. When the
 *  target is reachable, `state.history` is backfilled from the resolved path up to that
 *  point (empty for the intro step, the full resolved path for the confirmation step)
 *  so the Back button works immediately on a resumed step. */
export function computeInitialFlowState(flow: Flow, options: InitialFlowStateOptions = {}): FlowState {
  let state = createFlowState()
  if (options.initialAnswers) {
    state = { ...state, answers: filterValidAnswers(flow, options.initialAnswers) }
  }
  if (options.initialStepId) {
    const probe: FlowState = { ...state, index: flow.steps.length - 1 }
    if (isStepReachable(flow, probe, options.initialStepId)) {
      const targetIndex = flow.steps.findIndex((s) => s.id === options.initialStepId)!
      const def = getStepTypeDefinition(flow.steps[targetIndex]!.type)
      const path = resolveFlowPath(flow, probe)
      let history: string[]
      if (def?.role === "intro") {
        history = []
      } else if (def?.role === "confirmation") {
        history = path.stepIds
      } else {
        const targetPos = path.stepIds.indexOf(options.initialStepId)
        history = targetPos > 0 ? path.stepIds.slice(0, targetPos) : []
      }
      state = { ...state, index: targetIndex, history }
    }
  }
  return state
}

export interface AnswerUpdateResult {
  state: FlowState
  /** True when this answer changed the resolved path (see `resolveFlowPath`) — a
   *  branch further along now (or no longer) applies. Implies any already-collected
   *  answer/meta for a step the new path dropped got discarded too, but is `true`
   *  whenever the path diverges even if there was nothing to discard yet (e.g. the
   *  user hasn't reached that far downstream on this pass) — see
   *  `setAnswerAndInvalidateDownstream`. */
  invalidated: boolean
}

/** `setAnswer`, followed by discarding any already-collected answer/meta for a step that
 *  the new value just made unreachable — the case where a user goes Back past a
 *  "branch" step, changes the answer that drives it, and the branch would now send them
 *  down a different path than the one they'd already walked and answered. Without this,
 *  those stale answers linger in `state.answers` forever (nothing else in the engine
 *  ever removes a key once set) and would leak into `onSubmit`/reports even though the
 *  step that produced them is no longer part of the flow the user is actually taking.
 *
 *  `invalidated` reflects the resolved path itself changing (compared right before vs.
 *  right after this answer), not just whether something was actually deleted — a caller
 *  driving UI feedback (e.g. `FlowRunner`'s `onStepChange` "branch-change" event) needs
 *  to know the route changed even on a first pass with nothing yet collected downstream
 *  to prune.
 *
 *  Pruning itself only happens within the span the engine has actually walked/resolved
 *  (up to the furthest step position appearing in the recomputed `resolveFlowPath`): a
 *  step beyond an unresolved branch further ahead is left untouched, since whether it's
 *  reachable genuinely isn't known yet — pruning it now would risk discarding an answer
 *  that turns out to still be needed. */
export function setAnswerAndInvalidateDownstream(
  flow: Flow,
  state: FlowState,
  step: Step,
  value: AnswerValue,
): AnswerUpdateResult {
  const beforePath = resolveFlowPath(flow, state)
  const updated = setAnswer(state, step, value)
  const path = resolveFlowPath(flow, updated)
  const reachable = new Set(path.stepIds)

  const pathChanged =
    path.determinate !== beforePath.determinate ||
    path.stepIds.length !== beforePath.stepIds.length ||
    path.stepIds.some((id, i) => id !== beforePath.stepIds[i])

  const indexById = new Map(flow.steps.map((s, i) => [s.id, i] as const))
  const walkedIndex = path.stepIds.reduce(
    (max, id) => Math.max(max, indexById.get(id) ?? -1),
    updated.index,
  )

  const nextAnswers = { ...updated.answers }
  const nextMeta = { ...updated.meta }

  flow.steps.forEach((s, idx) => {
    if (idx <= updated.index || idx > walkedIndex || reachable.has(s.id)) return
    const key = answerKey(s)
    delete nextAnswers[key]
    delete nextMeta[s.id]
  })

  if (!pathChanged) return { state: updated, invalidated: false }
  return { state: { ...updated, answers: nextAnswers, meta: nextMeta }, invalidated: true }
}
