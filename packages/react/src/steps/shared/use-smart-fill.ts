import { useEffect } from "react"
import { computeStepAddonValue } from "@flowkit-io/core"
import type { Answers, Step } from "@flowkit-io/core"

export interface SmartFillResult {
  /** True when this step has a "smartFill" add-on configured (whether or not a
   *  suggestion could currently be computed). */
  hasAddon: boolean
  /** True while the field's current value is the live, unmodified suggestion — lets the
   *  view show a "suggerito" hint that disappears once the user edits it. */
  isSuggested: boolean
  /** Wraps the step's own onChange: call this instead, from the input's onChange. */
  handleChange: (newValue: string) => void
}

/**
 * Wires a text step to its "smartFill" add-on (if any): auto-fills the field with the
 * generator's suggestion whenever the source answers produce a new one, unless the user
 * has manually overridden the value — in which case the override is kept forever (until
 * flow restart), even as source answers keep changing. The override flag and the last
 * suggestion written both live in step meta (FlowState.meta), not component state, so
 * they survive the view unmounting when the user navigates away and back.
 */
export function useSmartFill(
  step: Step,
  value: string,
  onChange: (value: string) => void,
  answers: Answers,
  meta: Record<string, unknown>,
  onMetaChange: (patch: Record<string, unknown>) => void,
): SmartFillResult {
  const addon = (step as { addons?: { type: string }[] }).addons?.find(
    (a): a is Parameters<typeof computeStepAddonValue>[0] => a.type === "smartFill",
  )
  const suggestion = addon ? computeStepAddonValue(addon, answers) : undefined
  const overridden = meta.smartFillOverridden === true
  const lastSuggestion = meta.smartFillLastSuggestion as string | undefined

  useEffect(() => {
    if (!addon || suggestion === undefined || overridden) return
    if (value === suggestion && lastSuggestion === suggestion) return
    onMetaChange({ smartFillLastSuggestion: suggestion })
    if (value !== suggestion) onChange(suggestion)
    // Deliberately excludes `value`/`onChange`/`onMetaChange`/`lastSuggestion`: this must
    // re-run only when the add-on config or the computed suggestion (i.e. source answers)
    // or the override flag change, not on every keystroke the user makes in this field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addon, suggestion, overridden])

  function handleChange(newValue: string) {
    if (addon && newValue !== (lastSuggestion ?? suggestion)) {
      onMetaChange({ smartFillOverridden: true })
    }
    onChange(newValue)
  }

  return {
    hasAddon: !!addon,
    isSuggested: !!addon && !overridden && value === suggestion && value !== "",
    handleChange,
  }
}
