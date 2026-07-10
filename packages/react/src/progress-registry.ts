import type { ComponentType } from "react"

export interface ProgressComponentProps {
  pct: number
  currentIndex: number
  total: number
}

/**
 * Registry dei componenti barra di progresso, stesso pattern del registry
 * degli step (registry.tsx): "bar"/"dots" sono built-in, un consumer può
 * registrarne di custom con la propria chiave e referenziarla da
 * theme.layout.progressVariant.
 */
const registry = new Map<string, ComponentType<ProgressComponentProps>>()

export function registerProgressComponent(key: string, Component: ComponentType<ProgressComponentProps>): void {
  registry.set(key, Component)
}

export function getProgressComponent(key: string): ComponentType<ProgressComponentProps> | undefined {
  return registry.get(key)
}
