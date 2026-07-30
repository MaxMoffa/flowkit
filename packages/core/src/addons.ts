import { z } from "zod"
import type { Answers } from "./machine"

/**
 * A step add-on augments an existing step type's behavior without introducing a new
 * step type. "smartFill" (v2.29) is the first: it suggests a value for a text step,
 * computed from other steps' answers via a registered generator function.
 */
export const smartFillAddonSchema = z.object({
  type: z.literal("smartFill"),
  /** Id of a generator registered with registerSmartFillGenerator (see smart-fill.ts). */
  generator: z.string().min(1),
  /** Maps each of the generator's logical input names to the id of the flow step that
   *  provides it (e.g. { nome: "first-name-step", ... }). */
  sourceFields: z.record(z.string(), z.string()),
})

export const stepAddonSchema = z.discriminatedUnion("type", [smartFillAddonSchema])

export type SmartFillAddon = z.infer<typeof smartFillAddonSchema>
export type StepAddon = z.infer<typeof stepAddonSchema>

export interface SmartFillGeneratorDefinition {
  id: string
  /** Logical input names this generator needs, resolved via the addon's sourceFields. */
  inputs: string[]
  /** Returns the suggested value, or undefined if the inputs don't allow computing one
   *  (e.g. an unrecognized format) — callers must treat undefined as "no suggestion". */
  compute: (inputs: Record<string, string>) => string | undefined
}

const smartFillGenerators = new Map<string, SmartFillGeneratorDefinition>()

/** Registers a SmartFill generator function, extending the built-in registry (currently
 *  just "codiceFiscale") with a new input -> output mapping. */
export function registerSmartFillGenerator(def: SmartFillGeneratorDefinition): void {
  smartFillGenerators.set(def.id, def)
}

export function getSmartFillGenerator(id: string): SmartFillGeneratorDefinition | undefined {
  return smartFillGenerators.get(id)
}

export function listSmartFillGenerators(): string[] {
  return Array.from(smartFillGenerators.keys())
}

/**
 * Resolves a step add-on's suggested value from the flow's current answers. Returns
 * undefined when the add-on's generator isn't registered, or when a required source
 * field's answer is missing/not a non-empty string yet (nothing to suggest from).
 */
export function computeStepAddonValue(addon: StepAddon, answers: Answers): string | undefined {
  if (addon.type === "smartFill") {
    const generator = getSmartFillGenerator(addon.generator)
    if (!generator) return undefined
    const inputs: Record<string, string> = {}
    for (const inputKey of generator.inputs) {
      const sourceStepId = addon.sourceFields[inputKey]
      const raw = sourceStepId ? answers[sourceStepId] : undefined
      if (typeof raw !== "string" || raw.trim().length === 0) return undefined
      inputs[inputKey] = raw
    }
    return generator.compute(inputs)
  }
  return undefined
}
