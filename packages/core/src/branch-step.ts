import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields } from "./schema"

/**
 * Declarative condition, evaluated against the flow's `answers` (keyed by each step's
 * resolved `key`, see resolveStepKeys/answerKey). No `eval`/code execution: this is
 * data, not code, so a flow config from an untrusted source can't run arbitrary logic.
 */
export type ConditionOp =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "notIn"
  | "contains"
  | "truthy"
  | "falsy"

export interface LeafCondition {
  key: string
  op: ConditionOp
  value?: unknown
}
export interface AllCondition {
  all: Condition[]
}
export interface AnyCondition {
  any: Condition[]
}
export interface NotCondition {
  not: Condition
}
export type Condition = LeafCondition | AllCondition | AnyCondition | NotCondition

const leafConditionSchema = z.object({
  key: z.string().min(1),
  op: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "in", "notIn", "contains", "truthy", "falsy"]),
  value: z.unknown().optional(),
})

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({ all: z.array(conditionSchema) }),
    z.object({ any: z.array(conditionSchema) }),
    z.object({ not: conditionSchema }),
    leafConditionSchema,
  ]),
)

/** Evaluates a condition against a flat answers object (`Record<key, value>`). Numeric
 *  comparisons (gt/gte/lt/lte) require both sides to actually be numbers, else false. */
export function evaluateCondition(condition: Condition, answers: Record<string, unknown>): boolean {
  if ("all" in condition) return condition.all.every((c) => evaluateCondition(c, answers))
  if ("any" in condition) return condition.any.some((c) => evaluateCondition(c, answers))
  if ("not" in condition) return !evaluateCondition(condition.not, answers)

  const actual = answers[condition.key]
  switch (condition.op) {
    case "eq":
      return actual === condition.value
    case "neq":
      return actual !== condition.value
    case "gt":
      return typeof actual === "number" && typeof condition.value === "number" && actual > condition.value
    case "gte":
      return typeof actual === "number" && typeof condition.value === "number" && actual >= condition.value
    case "lt":
      return typeof actual === "number" && typeof condition.value === "number" && actual < condition.value
    case "lte":
      return typeof actual === "number" && typeof condition.value === "number" && actual <= condition.value
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(actual)
    case "notIn":
      return Array.isArray(condition.value) && !condition.value.includes(actual)
    case "contains":
      return Array.isArray(actual) && actual.includes(condition.value)
    case "truthy":
      return Boolean(actual)
    case "falsy":
      return !actual
    default:
      return false
  }
}

export const branchRuleSchema = z.object({
  when: conditionSchema,
  /** Id of the step to jump to when `when` matches (step `id`, not `key`: same target
   *  namespace as goToStep/the review step's clickable rows). */
  goTo: z.string().min(1),
})
export type BranchRule = z.infer<typeof branchRuleSchema>

/**
 * Invisible step (role: "logic"): FlowRunner resolves it and jumps to a target step
 * without ever rendering it. Rules are evaluated in order, first match wins; `fallback`
 * (a step id) is used when no rule matches, else the natural next step in the flow.
 */
export const branchStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("branch"),
  rules: z.array(branchRuleSchema).default([]),
  fallback: z.string().optional(),
})
export type BranchStep = z.infer<typeof branchStepSchema>

registerStepType({
  type: "branch",
  schema: branchStepSchema,
  validate: () => true,
  role: "logic",
  includeInSummary: false,
})
