import type { ComponentType } from "react"

export interface ProgressComponentProps {
  /** null while the path ahead can't yet be determined (see core's getProgressInfo) —
   *  render an indeterminate indicator instead of a fixed fill/count. */
  pct: number | null
  currentIndex: number
  total: number | null
  /** Title/subtitle (description) of every step on the resolved path, in order —
   *  undefined while the path can't yet be fully determined (mirrors `total: null`) or
   *  for variants that don't need it. Populated by FlowRunner; bar/dots ignore it.
   *  A variant is free to show only part of it: the built-in "steps" stepper renders
   *  the descriptions of the current step only. */
  steps?: { title?: string; subtitle?: string }[]
}

/**
 * Registry of progress-bar components, same pattern as the step registry
 * (registry.tsx): "bar"/"dots" are built-in, a consumer can register custom
 * ones with their own key and reference it from theme.layout.progressVariant.
 */
const registry = new Map<string, ComponentType<ProgressComponentProps>>()

export function registerProgressComponent(key: string, Component: ComponentType<ProgressComponentProps>): void {
  registry.set(key, Component)
}

export function getProgressComponent(key: string): ComponentType<ProgressComponentProps> | undefined {
  return registry.get(key)
}
