import { z } from "zod"
import { registerStepType, getStepTypeDefinition } from "./registry"
import { parseStep, type Step } from "./schema"

/**
 * Step "group" (v2.14+): compone più step in un'unica pagina, senza propria
 * navigazione/validazione nella state machine — conta come un normale step
 * "foglia" del flow (nessun `role` speciale). Le risposte dei figli restano
 * annidate sotto l'id del gruppo (Record<childId, valore>), non flat: questo
 * evita ogni modifica a canGoNext/progress/next/prev in machine.ts, perché
 * il validate del gruppo (sotto) implementa già l'aggregazione richiesta.
 */
export const groupStepSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("group"),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    required: z.boolean().default(true),
    icon: z.string().optional(),
    themeOverride: z.record(z.string(), z.unknown()).optional(),
    layout: z.enum(["stack", "columns"]).default("stack"),
    steps: z.array(z.unknown()).min(1),
  })
  .transform((val) => ({ ...val, steps: val.steps.map(parseStep) }))

export type GroupStep = z.infer<typeof groupStepSchema> & { steps: Step[] }

registerStepType({
  type: "group",
  schema: groupStepSchema,
  validate: (step, value) => {
    const groupStep = step as GroupStep
    const aggregate = (value ?? {}) as Record<string, unknown>
    return groupStep.steps.every((child) => {
      const def = getStepTypeDefinition(child.type)
      if (!def) return false
      if ((child as { required?: boolean }).required === false) return true
      return def.validate(child, aggregate[child.id], aggregate)
    })
  },
})
