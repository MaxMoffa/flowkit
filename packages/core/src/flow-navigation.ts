import type { Flow } from "./schema"
import { getCurrentStep, getStepMeta, isLastStep, type FlowState } from "./flow-state"
import { isStepValid } from "./flow-validation"

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

/** @deprecated Counts every step declared in the flow, including ones a branch will
 *  skip — use `getProgressInfo` (branch-aware) instead. Kept for backward compatibility. */
export function progress(flow: Flow, state: FlowState): number {
  return (state.index + 1) / flow.steps.length
}
