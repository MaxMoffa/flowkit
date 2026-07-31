import type { z } from "zod"

/**
 * Definition of a runtime-registrable step type. Replaces the closed
 * discriminatedUnion: new types (built-in or custom) are added by calling
 * registerStepType, without touching schema.ts/machine.ts.
 */
export interface StepTypeDefinition<TStep = unknown, TValue = unknown> {
  type: string
  schema: z.ZodType<TStep, z.ZodTypeDef, unknown>
  /** `meta` is the step's own per-step meta bag (machine.ts's setStepMeta/getStepMeta)
   *  — ephemeral state that isn't the answer itself, e.g. the "long-content" step's
   *  scroll-to-end flag. Optional (not every type needs it) and passed as `{}` when the
   *  caller has none, so existing 2/3-arg validate functions are unaffected. */
  validate: (
    step: TStep,
    value: TValue,
    answers: Record<string, unknown>,
    meta?: Record<string, unknown>,
  ) => boolean
  /** Optional role in the wizard: hides the header and drives FlowRunner's CTA/footer.
   *  "review" marks a recap step; assertFlowStepOrder (schema.ts) allows any number of
   *  review steps but constrains at most one non-checkpoint ("final") one, which must
   *  sit immediately before the confirmation step. "logic" marks an invisible step
   *  (e.g. "branch") that FlowRunner resolves and jumps past without ever rendering. */
  role?: "intro" | "review" | "confirmation" | "logic"
  /** Whether this type's steps appear in buildReportRows' summary/payload. Default true
   *  (unset). Set false for content-only types that add no field to the flow (e.g.
   *  "info", "long-content") — they'd otherwise show up as an empty "—" row. */
  includeInSummary?: boolean
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
