import type { Flow, Step } from "./schema"

export type AnswerValue = string | number | string[] | { text?: string; photo?: string } | null

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

/** Restituisce true se la risposta soddisfa i vincoli minimi dello step. */
export function isStepValid(step: Step, answers: Answers): boolean {
  if (step.required === false) return true

  const value = answers[step.id]

  switch (step.type) {
    case "intro":
    case "review":
    case "confirmation":
      return true
    case "location":
      return typeof value === "string" && value.trim().length > 0
    case "select-cards":
      if (step.multiple) return Array.isArray(value) && value.length > 0
      return typeof value === "string" && value.length > 0
    case "scale":
    case "nps":
      return typeof value === "number"
    case "chips":
      if (step.multiple) return Array.isArray(value) && value.length > 0
      return typeof value === "string" && value.length > 0
    case "faces":
      return typeof value === "string" && value.length > 0
    case "multi-select": {
      const arr = Array.isArray(value) ? value : []
      if (arr.length < step.min) return false
      if (step.max !== undefined && arr.length > step.max) return false
      return step.min > 0 ? arr.length > 0 : true
    }
    case "notes-photo":
      return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        (Boolean(value.text?.trim()) || Boolean(value.photo))
      )
    case "text": {
      if (typeof value !== "string" || value.trim().length === 0) return false
      if (step.variant === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      if (step.variant === "number") return !Number.isNaN(Number(value))
      return true
    }
    default:
      return true
  }
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
