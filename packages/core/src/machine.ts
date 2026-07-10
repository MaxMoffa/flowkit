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
  | string[]
  | OAuthResult
  | { lat?: number; lng?: number; address?: string; regionId?: string; pointId?: string }
  | Record<string, unknown>
  | null

export type Answers = Record<string, AnswerValue>

export interface FlowState {
  index: number
  answers: Answers
}

export function createFlowState(): FlowState {
  return { index: 0, answers: {} }
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
  if (isFirstStep(state)) return state
  return { ...state, index: state.index - 1 }
}

export function canGoNext(flow: Flow, state: FlowState): boolean {
  return isStepValid(getCurrentStep(flow, state), state.answers)
}

export function progress(flow: Flow, state: FlowState): number {
  return (state.index + 1) / flow.steps.length
}
