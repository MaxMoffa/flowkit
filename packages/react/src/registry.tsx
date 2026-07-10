import type { ComponentType } from "react"
import type { Step } from "@flowkit/core"
import type { StepComponentProps } from "./types"

/**
 * Registry of React components per step type. Replaces the closed Record:
 * new types (built-in or custom) are added by calling
 * registerStepComponent, without touching this file.
 */
const registry = new Map<string, ComponentType<StepComponentProps<Step>>>()

export function registerStepComponent<T extends Step = Step>(
  type: string,
  Component: ComponentType<StepComponentProps<T>>,
): void {
  registry.set(type, Component as unknown as ComponentType<StepComponentProps<Step>>)
}

export function getStepComponent(type: string): ComponentType<StepComponentProps<Step>> | undefined {
  return registry.get(type)
}

/** @deprecated use getStepComponent(type); kept for backward compatibility of direct reads. */
export const stepRegistry = new Proxy(
  {},
  {
    get: (_target, prop: string) => registry.get(prop),
  },
) as Record<string, ComponentType<StepComponentProps<Step>> | undefined>
