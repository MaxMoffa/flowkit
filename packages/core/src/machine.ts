import type { Flow, Step } from "./schema"
import { getStepTypeDefinition } from "./registry"

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
}

export function createFlowState(): FlowState {
  return { index: 0, answers: {}, meta: {} }
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

/** Returns true if the answer satisfies the step's minimum constraints. */
export function isStepValid(step: Step, answers: Answers): boolean {
  if (step.required === false) return true

  const value = answers[step.id]
  const def = getStepTypeDefinition(step.type)
  // No validation registered for this type: passes (permissive default behavior).
  if (!def) return true
  return def.validate(step, value, answers)
}

export function setAnswer(state: FlowState, stepId: string, value: AnswerValue): FlowState {
  return { ...state, answers: { ...state.answers, [stepId]: value } }
}

export function next(flow: Flow, state: FlowState): FlowState {
  const step = getCurrentStep(flow, state)
  if (!isStepValid(step, state.answers)) return state
  if (isLastStep(flow, state)) return state
  return { ...state, index: state.index + 1 }
}

export function prev(flow: Flow, state: FlowState): FlowState {
  if (flow.disableBack || isFirstStep(state)) return state
  return { ...state, index: state.index - 1 }
}

/** Whether the "Indietro" affordance (button, review shortcuts) should be available:
 *  false on the first step regardless, and always false when the flow is forward-only. */
export function canGoBack(flow: Flow, state: FlowState): boolean {
  return !flow.disableBack && !isFirstStep(state)
}

/** Jumps directly to a step by id (unlike next/prev, which move ±1). Used to let a
 *  clickable review row navigate straight to the step that produced an answer. */
export function goToStep(flow: Flow, state: FlowState, stepId: string): FlowState {
  const index = flow.steps.findIndex((s) => s.id === stepId)
  if (index === -1) {
    throw new Error(`Flow "${flow.id}" has no step with id "${stepId}"`)
  }
  return { ...state, index }
}

export function canGoNext(flow: Flow, state: FlowState): boolean {
  return isStepValid(getCurrentStep(flow, state), state.answers)
}

export function progress(flow: Flow, state: FlowState): number {
  return (state.index + 1) / flow.steps.length
}
