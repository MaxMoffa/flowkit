import type { ComponentType } from "react"

export interface ProgressComponentProps {
  pct: number
  currentIndex: number
  total: number
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
