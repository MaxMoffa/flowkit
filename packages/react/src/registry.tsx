import type { ComponentType } from "react"
import type { Step } from "@flowkit/core"
import type { StepComponentProps } from "./types"

/**
 * Registry dei componenti React per tipo di step. Sostituisce il Record
 * chiuso: nuovi tipi (built-in o custom) si aggiungono chiamando
 * registerStepComponent, senza toccare questo file.
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

/** @deprecated usare getStepComponent(type); mantenuto per retro-compatibilità di lettura diretta. */
export const stepRegistry = new Proxy(
  {},
  {
    get: (_target, prop: string) => registry.get(prop),
  },
) as Record<string, ComponentType<StepComponentProps<Step>> | undefined>
