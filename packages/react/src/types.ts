import type { AnswerValue, Answers, Flow, Step } from "@flowkit-io/core"

export interface StepComponentProps<T extends Step = Step> {
  step: T
  value: AnswerValue
  onChange: (value: AnswerValue) => void
  flow: Flow
  answers: Answers
  /** Present only on review-role steps: jump the flow to another step by id (used by
   *  clickable review rows to edit an answer, then return to the review step). */
  onNavigateToStep?: (stepId: string) => void
  /** Per-step state bag that isn't the answer itself (e.g. the "smartFill" add-on's
   *  "user overrode the suggestion" flag). See FlowState.meta (core/machine.ts). */
  meta: Record<string, unknown>
  onMetaChange: (patch: Record<string, unknown>) => void
  /** Ids of steps actually visited so far in this run (the real path, including the
   *  current step) — lets a review/recap step exclude steps a branch skipped over. See
   *  FlowState.history (core/machine.ts). */
  visitedStepIds?: Set<string>
  /** Bumped by FlowRunner each time the user tries to advance ("Continua"/"Invia") while
   *  this step is invalid — see steps/shared/use-field-validation.ts. Force-surfaces a
   *  field's error even before it's been blurred. 0/undefined = no attempt yet. */
  validationAttempt?: number
}

export type FlowSubmitHandler = (answers: Record<string, AnswerValue>) => void | Promise<void>
