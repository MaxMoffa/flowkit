import { useRef, useState } from "react"
import type { Answers, Flow, Step } from "@flowkit-io/core"
import { getValidationIssueForValue, resolveValidationMessage } from "@flowkit-io/core"

export interface FieldValidation {
  /** Resolved error message, or null while the field has no visible error. */
  message: string | null
  showError: boolean
  errorId: string
  handleBlur: () => void
  ariaProps: { "aria-invalid": true | undefined; "aria-describedby": string | undefined }
}

/**
 * Drives a single field's error-message timing: silent until the field is blurred;
 * once an error has surfaced once, later edits validate live and the error clears the
 * instant the value becomes valid. `validationAttempt` (bumped by FlowRunner each time
 * the user tries to advance past an invalid field, see flow-runner.tsx) force-surfaces
 * the error even without a blur, and switches the field into live mode too.
 */
export function useFieldValidation(
  step: Step,
  value: unknown,
  flow: Flow,
  answers: Answers,
  meta: Record<string, unknown>,
  validationAttempt = 0,
): FieldValidation {
  const [hadError, setHadError] = useState(false)
  const issue = getValidationIssueForValue(step, value, answers, meta)

  // Adjusting a ref during render (not an effect): FlowRunner's post-attempt focus
  // move (flow-runner.tsx) queries the DOM for `aria-invalid="true"` right after the
  // attempt that triggered it, in the very next effect flush — going through an effect
  // here first would make that force-show land one render late, after the focus query
  // already ran and found nothing.
  const attemptedRef = useRef(false)
  if (validationAttempt > 0) attemptedRef.current = true

  const showError = (hadError || attemptedRef.current) && issue !== null
  const errorId = `${step.id}-error`

  return {
    message: showError ? resolveValidationMessage(flow, step, issue!) : null,
    showError,
    errorId,
    handleBlur: () => {
      if (issue !== null) setHadError(true)
    },
    ariaProps: {
      "aria-invalid": showError ? true : undefined,
      "aria-describedby": showError ? errorId : undefined,
    },
  }
}
