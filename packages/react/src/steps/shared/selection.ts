import type { AnswerValue } from "@flowkit-io/core"

export interface SelectionOptions {
  /** Unset/false: the answer is a single string. True: the answer is a string[]. */
  multiple?: boolean
  /** Multiple mode only: refuse to select past this many options. */
  max?: number
}

export interface Selection {
  selected: string[]
  toggle: (optionValue: string) => void
  /** True when `max` is reached: unselected options should render as disabled. */
  maxReached: boolean
}

/**
 * Single/multiple option selection, shared by every step that lets the user pick from a
 * list. Single mode still exposes `selected` as an array so views can render both modes
 * with one `selected.includes(...)` check.
 */
export function useToggleSelection(
  { multiple, max }: SelectionOptions,
  value: AnswerValue,
  onChange: (value: AnswerValue) => void,
): Selection {
  const selected = multiple
    ? Array.isArray(value)
      ? (value as string[])
      : []
    : typeof value === "string"
      ? [value]
      : []

  const maxReached = multiple === true && max !== undefined && selected.length >= max

  function toggle(optionValue: string) {
    if (!multiple) {
      onChange(optionValue)
      return
    }
    if (selected.includes(optionValue)) {
      onChange(selected.filter((v) => v !== optionValue))
      return
    }
    if (max !== undefined && selected.length >= max) return
    onChange([...selected, optionValue])
  }

  return { selected, toggle, maxReached }
}
