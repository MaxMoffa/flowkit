import type { Flow, Step } from "./schema"
import { getStepTypeDefinition } from "./registry"
import { answerKey, createFlowState, setAnswer, type AnswerValue, type Answers, type FlowState } from "./flow-state"
import { filterValidAnswers } from "./flow-validation"
import { isStepReachable, resolveFlowPath } from "./flow-path"

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
