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
}

export type FlowSubmitHandler = (answers: Record<string, AnswerValue>) => void | Promise<void>
