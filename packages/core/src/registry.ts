import type { z } from "zod"

/**
 * Definition of a runtime-registrable step type. Replaces the closed
 * discriminatedUnion: new types (built-in or custom) are added by calling
 * registerStepType, without touching schema.ts/machine.ts.
 */
export interface StepTypeDefinition<TStep = unknown, TValue = unknown> {
  type: string
  schema: z.ZodType<TStep, z.ZodTypeDef, unknown>
  validate: (step: TStep, value: TValue, answers: Record<string, unknown>) => boolean
  /** Optional role in the wizard: hides the header and drives FlowRunner's CTA/footer. */
  role?: "intro" | "confirmation"
}

const registry = new Map<string, StepTypeDefinition>()

export function registerStepType<TStep, TValue>(
  def: StepTypeDefinition<TStep, TValue>,
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the registry is heterogeneous by design (different step types coexist)
  registry.set(def.type, def as StepTypeDefinition<any, any>)
}

export function getStepTypeDefinition(type: string): StepTypeDefinition<unknown, unknown> | undefined {
  return registry.get(type)
}

export function listRegisteredStepTypes(): string[] {
  return Array.from(registry.keys())
}
