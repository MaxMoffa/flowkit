import type { AnswerValue, Answers, Flow, Step } from "@flowkit-io/core"

export interface StepComponentProps<T extends Step = Step> {
  step: T
  value: AnswerValue
  onChange: (value: AnswerValue) => void
  flow: Flow
  answers: Answers
}

export type FlowSubmitHandler = (answers: Record<string, AnswerValue>) => void | Promise<void>
