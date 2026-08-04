import type { Flow, Step } from "./schema"
import { getStepTypeDefinition, type ValidationIssue } from "./registry"
import { answerKey, type Answers } from "./flow-state"

/** Returns true if the answer satisfies the step's minimum constraints. `meta` is the
 *  step's own meta bag (see FlowState.meta) — used by types that gate on ephemeral,
 *  non-answer state (e.g. "long-content"'s requireScrollToEnd). */
export function isStepValid(step: Step, answers: Answers, meta: Record<string, unknown> = {}): boolean {
  if (step.required === false) return true

  const value = answers[answerKey(step)]
  const def = getStepTypeDefinition(step.type)
  // No validation registered for this type: passes (permissive default behavior).
  if (!def) return true
  return def.validate(step, value, answers, meta)
}

/** Display-only counterpart of `isStepValid`: returns the specific rule that failed
 *  instead of a plain boolean, for field-anchored error messages. Deliberately *not*
 *  the same gate as `isStepValid` — `required: false` still fully bypasses navigation
 *  gating there, but here it only suppresses the "required" rule (empty is fine on an
 *  optional field), letting other rules (format, length, range, …) still surface a
 *  message when the user did type something invalid into an optional field.
 *
 *  Takes `value` directly rather than looking it up in `answers` itself: a "group"
 *  child's own value lives in the group's nested aggregate (see group-step.ts), not
 *  under its key in the flat flow-level `answers` a step component receives — reading
 *  `answers[answerKey(step)]` here would silently see `undefined` for every group child
 *  regardless of what's actually selected. `answers`/`meta` are still passed through
 *  as-is, for any custom step type's `getIssue` that cross-references other fields. */
export function getValidationIssueForValue(
  step: Step,
  value: unknown,
  answers: Answers,
  meta: Record<string, unknown> = {},
): ValidationIssue | null {
  const def = getStepTypeDefinition(step.type)
  if (!def) return null

  const issue = def.getIssue
    ? def.getIssue(step, value, answers, meta)
    : def.validate(step, value, answers, meta)
      ? null
      : { rule: "required" as const }

  if (step.required === false && issue?.rule === "required") return null
  return issue
}

/** `getValidationIssueForValue` for a top-level step, whose own value *is* under its
 *  key in `answers` (state.answers) — see that function for why a group child can't
 *  use this shortcut. */
export function getStepValidationIssue(
  step: Step,
  answers: Answers,
  meta: Record<string, unknown> = {},
): ValidationIssue | null {
  return getValidationIssueForValue(step, answers[answerKey(step)], answers, meta)
}

/** Keeps only the entries of `rawAnswers` that belong to a real step (matched by
 *  `answerKey`) and pass that step's own validation rule — the same `validate`
 *  function `isStepValid` uses (there's no zod schema for an answer *value*, only for
 *  a step's own config). Unknown keys and values that fail validation are dropped
 *  silently, never throw. Used by `computeInitialFlowState` (`initialAnswers`) and
 *  `FlowRunner`'s imperative `setAnswers`. */
export function filterValidAnswers(flow: Flow, rawAnswers: Answers): Answers {
  const byKey = new Map(flow.steps.map((s) => [answerKey(s), s] as const))
  const result: Answers = {}
  for (const [key, value] of Object.entries(rawAnswers)) {
    const step = byKey.get(key)
    if (!step) continue
    const def = getStepTypeDefinition(step.type)
    if (def && !def.validate(step, value, rawAnswers, {})) continue
    result[key] = value
  }
  return result
}
