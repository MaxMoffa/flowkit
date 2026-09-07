import type { AddressValue, AnswerValue, Answers, ErrorPayloadInput, Flow, Step } from "@flowkit-io/core"

/** Public shape accepted by `FlowRunnerHandle.showError()` and a step's
 *  `props.onError()`. Adds an optional `onRetry` callback (a function, hence not part
 *  of the JSON-serializable `ErrorPayloadInput`) run when the user picks a `retry`
 *  action on the error screen. */
export interface ShowErrorPayload extends Omit<ErrorPayloadInput, "canRetry"> {
  onRetry?: () => void | Promise<void>
}

export interface StepComponentProps<T extends Step = Step> {
  step: T
  value: AnswerValue
  onChange: (value: AnswerValue) => void
  flow: Flow
  answers: Answers
  /** Host page's best-guess visitor address — typically just `{ country }` from a
   *  server-side IP lookup — passed through `FlowRunnerProps.estimatedAddress`. Lets a
   *  step show a tax estimate (`calculateTax`) before the flow's own `address` step (if
   *  any) has been answered, the way most storefronts price-with-tax pre-checkout. Not
   *  validated or trusted for the actual charge — the platform re-derives that
   *  server-side from the real address, same as `calculateTax` itself. */
  estimatedAddress?: Partial<AddressValue>
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
  /** Raise the generic error screen (see `flow.errorScreen`) from inside a step — e.g.
   *  a custom step whose own async call failed. No-op unless the flow declares
   *  `errorScreen`. */
  onError?: (payload: ShowErrorPayload) => void
}

export type FlowSubmitHandler = (answers: Record<string, AnswerValue>) => void | Promise<void>
