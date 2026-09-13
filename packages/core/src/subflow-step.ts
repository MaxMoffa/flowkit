import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields, parseStep, type Step } from "./schema"

/**
 * "subflow" step (v2.4x): a step that behaves, to the visitor, as if they'd entered a
 * fully separate flow — its children render one at a time using the SAME chrome
 * (header/back button/footer "Continua") the outer flow already renders every step
 * with, just showing a local, span-scoped progress count instead of the whole flow's
 * (see `getLocalProgressInfo`, flow-path.ts) while positioned inside it. Answers merge
 * flat into the outer flow's single `answers` object exactly as if these children were
 * ordinary top-level steps — NOT a nested `{ [childId]: value }` aggregate the way
 * `group` works (`group` fuses steps onto one page instead).
 *
 * This step type is never actually rendered, and never appears in a parsed `Flow`'s own
 * `steps` array: `parseFlow` flattens it away (`flattenSubflows`, schema.ts), splicing
 * its own children directly in its place — the only surviving trace is a `SubflowSpan`
 * entry on `Flow.subflowSpans`, letting the local-progress lookup (and any consumer
 * that wants to show "you're inside X") find which flattened steps came from it.
 *
 * "Inline config only", by design: `steps` is a plain, already-embedded step list, same
 * as `group.steps` — there's no notion of referencing an external flow by id here. A
 * consumer composing a subflow from a separately-authored/versioned flow is expected to
 * resolve "which flow version" and inline its `steps` before calling `parseFlow`.
 */
export const subflowStepSchema = z
  .object({
    ...baseStepFields,
    type: z.literal("subflow"),
    steps: z.array(z.unknown()).min(1),
  })
  .transform((val) => ({ ...val, steps: val.steps.map(parseStep) }))

/** Not part of `StepTypeMap` (same reason `GroupStep` isn't — typing `steps: Step[]`
 *  there would close a cycle with `Step` itself). Never actually present in a parsed
 *  `Flow.steps` (see the schema doc comment above) — this type only describes the raw,
 *  pre-flatten shape `parseStep` produces for a "subflow"-typed input. */
export type SubflowStep = z.infer<typeof subflowStepSchema> & { steps: Step[] }

// `validate` is never actually invoked at runtime: a "subflow" step is flattened away
// by `parseFlow` before anything calls `isStepValid` on a flow's steps, so nothing of
// this type ever reaches the state machine. Registered anyway because `parseStep`
// dispatches on the type registry during the FIRST (pre-flatten) parse pass.
registerStepType({
  type: "subflow",
  schema: subflowStepSchema,
  validate: () => true,
})
