import { z } from "zod"
import { registerStepType, type ValidationIssue } from "./registry"
import { baseStepFields } from "./schema"
import { catalogItemSchema, asCatalogValue, catalogTotal, orderLines, type CatalogValue } from "./catalog-step"

/**
 * "product" step — the "hero" sibling of `catalog` (catalog-step.ts): a showcase for
 * one or a handful of products, not a full catalog/cart. Same item shape
 * (`catalogItemSchema`, reused verbatim — value/label/description/details/price/
 * image/maxQuantity/taxCode) and the same `{ items: [{value, quantity}], total }`
 * answer shape, so it plugs into `buildOrderSummary`/`payment-stripe`'s
 * `amountSource: "cart"` exactly like `catalog` does — no bespoke checkout wiring.
 *
 * What's different from `catalog`, on purpose:
 * - `items` is capped at 4 (`.min(1).max(4)`): this type is for a single-product
 *   landing-style step or a tiny lineup (e.g. 3 plan tiers), rendered as one or a
 *   few large "hero" cards (see `ProductStepView` in @flowkit-io/react), not a
 *   scrollable grid. A flow needing more than 4 items belongs on `catalog`.
 * - no `minItems`/`maxItems` fields: with at most 4 items and a hero layout there's
 *   no meaningful "pick between N and M of these" constraint — just "required" (at
 *   least one line with quantity > 0) when the step is marked required.
 */
export const productStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("product"),
  currency: z.string().length(3).default("eur"),
  items: z.array(catalogItemSchema).min(1).max(4),
  /** Default quantity ceiling for an item with no `maxQuantity` of its own. */
  maxPerItem: z.number().int().positive().default(99),
})

export type ProductStep = z.infer<typeof productStepSchema>

/** Same answer shape as `catalog` — kept as an alias (not a redeclare) so the two
 *  types stay interchangeable for any consumer code written against `CatalogValue`. */
export type ProductValue = CatalogValue

function productIssue(step: ProductStep, value: unknown): ValidationIssue | null {
  const lines = orderLines(value)
  if (lines.length === 0) {
    return step.required ? { rule: "required" } : null
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
  type: "product",
  schema: productStepSchema,
  validate: (step, value) => productIssue(step, value) === null,
  getIssue: (step, value) => productIssue(step, value),
})

export { asCatalogValue as asProductValue, catalogTotal as productTotal }
