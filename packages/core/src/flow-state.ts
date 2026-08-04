import type { Flow, Step } from "./schema"

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

export function setAnswer(state: FlowState, step: Step, value: AnswerValue): FlowState {
  return { ...state, answers: { ...state.answers, [answerKey(step)]: value } }
}
