import { z } from "zod"
import type { Flow } from "./schema"
import type { Answers } from "./flow-state"
import { answerKey } from "./flow-state"
import { registerStepType, type ValidationIssue } from "./registry"
import { baseStepFields, stepImageSchema } from "./schema"

/**
 * "catalog" step (v2.42) — the visitor builds an order: pick one or more of the
 * listed items and, for each, choose a quantity. The answer is a list of
 * `{ value, quantity }` lines plus the computed `total` (minor units).
 *
 * It carries no payment logic of its own. A `payment-stripe` step later in the
 * flow with `amountSource: "cart"` charges the sum of every catalog step's total
 * (see `computeOrderTotal`), so the same building blocks compose into a real
 * checkout without a bespoke step type.
 */
export const catalogItemSchema = z.object({
  /** Stable id stored in the answer — not shown to the visitor. */
  value: z.string().min(1),
  label: z.string().min(1),
  /** Short one-liner shown under the label on the card. */
  description: z.string().optional(),
  /** Longer markdown blurb — not shown on the card; opened in a drawer/dialog when the
   *  visitor taps the item. Absent = the item is not tap-to-expand. */
  details: z.string().optional(),
  /** Unit price in the step's currency minor unit (cents for EUR/USD). 0 = free. */
  price: z.number().int().nonnegative(),
  /** Per-item badge/thumbnail, same shape as a step's `image` (emoji / inline SVG / URL). */
  image: stepImageSchema.optional(),
  /** Ceiling for this specific item; falls back to the step's `maxPerItem`. */
  maxQuantity: z.number().int().positive().optional(),
  /** Stripe tax code (`txcd_…`) for this item — passed straight through to the
   *  platform's tax calculation (see `payment-stripe`'s `calculateTax`). Absent =
   *  the payment step's default tax code applies. */
  taxCode: z.string().optional(),
})

export type CatalogItem = z.infer<typeof catalogItemSchema>

export const catalogStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("catalog"),
  currency: z.string().length(3).default("eur"),
  items: z.array(catalogItemSchema).min(1),
  /** Minimum number of distinct line items the visitor must add. */
  minItems: z.number().int().nonnegative().default(0),
  /** Maximum number of distinct line items. */
  maxItems: z.number().int().positive().optional(),
  /** Default quantity ceiling for an item with no `maxQuantity` of its own. */
  maxPerItem: z.number().int().positive().default(99),
})

export type CatalogStep = z.infer<typeof catalogStepSchema>

export type CatalogLine = { value: string; quantity: number }

/** The step's answer value. `total` is a convenience echo of the computed sum in
 *  minor units — a consumer that charges the order must recompute it from the
 *  stored step config, never trust this field from the client. */
export type CatalogValue = { items: CatalogLine[]; total: number }

/** Narrows an untyped answer to a `CatalogValue`, or `null` if it isn't one. */
export function asCatalogValue(value: unknown): CatalogValue | null {
  if (value === null || typeof value !== "object") return null
  const current = value as CatalogValue
  if (!Array.isArray(current.items)) return null
  for (const line of current.items) {
    if (!line || typeof line !== "object") return null
    if (typeof line.value !== "string" || typeof line.quantity !== "number") return null
    if (!Number.isInteger(line.quantity) || line.quantity < 0) return null
  }
  return current
}

/** Non-zero lines only, deduplicated by `value` (last write wins). */
function orderLines(value: unknown): CatalogLine[] {
  const parsed = asCatalogValue(value)
  if (!parsed) return []
  const byValue = new Map<string, number>()
  for (const line of parsed.items) {
    if (line.quantity > 0) byValue.set(line.value, line.quantity)
  }
  return [...byValue].map(([value, quantity]) => ({ value, quantity }))
}

/** Total for one catalog step's answer, in the step's currency minor unit. */
export function catalogTotal(step: CatalogStep, value: unknown): number {
  const prices = new Map(step.items.map((item) => [item.value, item.price]))
  return orderLines(value).reduce(
    (sum, line) => sum + (prices.get(line.value) ?? 0) * line.quantity,
    0,
  )
}

function catalogIssue(step: CatalogStep, value: unknown): ValidationIssue | null {
  const lines = orderLines(value)
  if (lines.length === 0) {
    return step.required || step.minItems > 0 ? { rule: "required" } : null
  }
  if (lines.length < step.minItems) {
    return { rule: "tooFewOptions", params: { min: step.minItems, remaining: step.minItems - lines.length } }
  }
  if (step.maxItems !== undefined && lines.length > step.maxItems) {
    return { rule: "tooManyOptions", params: { max: step.maxItems, excess: lines.length - step.maxItems } }
  }
  const byValue = new Map(step.items.map((item) => [item.value, item]))
  for (const line of lines) {
    const item = byValue.get(line.value)
    if (!item) return { rule: "invalidFormat" }
    const cap = item.maxQuantity ?? step.maxPerItem
    if (line.quantity > cap) {
      return { rule: "outOfRange", params: { min: 1, max: cap } }
    }
  }
  return null
}

registerStepType({
  type: "catalog",
  schema: catalogStepSchema,
  validate: (step, value) => catalogIssue(step, value) === null,
  getIssue: (step, value) => catalogIssue(step, value),
})

/** One row of the order recap. `kind` is `"item"` for a catalog line (real
 *  quantity), `"fee"` for a priced option / flat surcharge (quantity 1). */
export interface OrderSummaryLine {
  /** Id of the step this line came from. */
  stepId: string
  /** Option/item value, or `"__surcharge__"` for the payment step's flat `amount`. */
  value: string
  label: string
  quantity: number
  /** Unit price in `currency` minor units. */
  unitAmount: number
  /** `unitAmount × quantity`. */
  amount: number
  kind: "item" | "fee"
  /** Stripe tax code for the line, when the catalog item carries one. */
  taxCode?: string
}

export interface OrderSummary {
  currency: string
  lines: OrderSummaryLine[]
  /** Sum of every line's `amount`, in `currency` minor units. */
  total: number
}

type PricedOptionStep = { options?: { value: string; label?: string; price?: number }[] }
type PaymentStepShape = {
  id: string
  type: string
  amountSource?: "fixed" | "cart"
  amount?: number
  currency?: string
  description?: string
}

/**
 * Itemized recap of every priced selection in the flow, for the review step:
 * - each `catalog` step contributes one `"item"` line per picked item (`price ×
 *   quantity`);
 * - each `select-cards` / `multi-select` / `radio` / `chips` step contributes a
 *   `"fee"` line per selected option that carries a `price` (quantity 1);
 * - a `payment-stripe` step with `amountSource: "cart"` and a positive `amount`
 *   contributes a final `"fee"` line (label = its `description`, else "Supplemento").
 *
 * Returns `null` when nothing in the flow is priced. Currencies are assumed uniform
 * (the payment step's `currency` wins) — mixing currencies is an unchecked config error.
 */
export function buildOrderSummary(flow: Flow, answers: Answers): OrderSummary | null {
  const lines: OrderSummaryLine[] = []
  let currency: string | undefined

  for (const step of flow.steps) {
    if (step.type === "catalog") {
      const catalog = step as CatalogStep
      currency ??= catalog.currency
      const byValue = new Map(catalog.items.map((item) => [item.value, item]))
      const parsed = asCatalogValue(answers[answerKey(step)])
      const seen = new Set<string>()
      for (const line of parsed?.items ?? []) {
        if (line.quantity <= 0 || seen.has(line.value)) continue
        const item = byValue.get(line.value)
        if (!item) continue
        seen.add(line.value)
        lines.push({
          stepId: step.id,
          value: item.value,
          label: item.label,
          quantity: line.quantity,
          unitAmount: item.price,
          amount: item.price * line.quantity,
          kind: "item",
          taxCode: item.taxCode,
        })
      }
      continue
    }
    if (
      step.type === "select-cards" ||
      step.type === "multi-select" ||
      step.type === "radio" ||
      step.type === "chips"
    ) {
      const raw = answers[answerKey(step)]
      const picked = Array.isArray(raw) ? raw.map(String) : typeof raw === "string" ? [raw] : []
      const options = (step as PricedOptionStep).options ?? []
      for (const value of picked) {
        const option = options.find((entry) => entry.value === value)
        if (!option || typeof option.price !== "number") continue
        lines.push({
          stepId: step.id,
          value: option.value,
          label: option.label ?? option.value,
          quantity: 1,
          unitAmount: option.price,
          amount: option.price,
          kind: "fee",
        })
      }
    }
  }

  const payment = flow.steps.find((s) => s.type === "payment-stripe") as PaymentStepShape | undefined
  if (payment) {
    currency ??= payment.currency
    if (payment.amountSource === "cart" && typeof payment.amount === "number" && payment.amount > 0) {
      lines.push({
        stepId: payment.id,
        value: "__surcharge__",
        label: payment.description ?? "Supplemento",
        quantity: 1,
        unitAmount: payment.amount,
        amount: payment.amount,
        kind: "fee",
      })
    }
  }

  if (lines.length === 0) return null
  return {
    currency: currency ?? "eur",
    lines,
    total: lines.reduce((sum, line) => sum + line.amount, 0),
  }
}

/**
 * Sum of every priced selection in the flow, in minor units. Thin wrapper over
 * `buildOrderSummary` — kept as the name the `payment-stripe` step reaches for.
 * Note: this does NOT add the payment step's own flat surcharge (that would double
 * count in `resolvePaymentAmount`); it sums catalog items + priced options only.
 */
export function computeOrderTotal(flow: Flow, answers: Answers): number {
  const summary = buildOrderSummary(flow, answers)
  if (!summary) return 0
  return summary.lines
    .filter((line) => line.value !== "__surcharge__")
    .reduce((sum, line) => sum + line.amount, 0)
}
