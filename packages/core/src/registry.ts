import type { z } from "zod"

/**
 * Definizione di un tipo di step registrabile a runtime. Sostituisce la
 * discriminatedUnion chiusa: nuovi tipi (built-in o custom) si aggiungono
 * chiamando registerStepType, senza toccare schema.ts/machine.ts.
 */
export interface StepTypeDefinition<TStep = unknown, TValue = unknown> {
  type: string
  schema: z.ZodType<TStep, z.ZodTypeDef, unknown>
  validate: (step: TStep, value: TValue, answers: Record<string, unknown>) => boolean
  /** Ruolo opzionale nel wizard: nasconde l'header e guida CTA/footer di FlowRunner. */
  role?: "intro" | "confirmation"
}

const registry = new Map<string, StepTypeDefinition>()

export function registerStepType<TStep, TValue>(
  def: StepTypeDefinition<TStep, TValue>,
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- il registry è eterogeneo per design (tipi di step diversi coesistono)
  registry.set(def.type, def as StepTypeDefinition<any, any>)
}

export function getStepTypeDefinition(type: string): StepTypeDefinition<unknown, unknown> | undefined {
  return registry.get(type)
}

export function listRegisteredStepTypes(): string[] {
  return Array.from(registry.keys())
}
