import { resolveText, type Flow } from "@flowkit-io/core"

/**
 * Discreet "+ IVA" / "IVA inclusa" hint shown next to a price or a total —
 * distinct from `useTaxCalculation`'s computed amount (which needs a real
 * address and shows the actual tax figure). This is just a static label
 * telling the visitor whether the price they see already includes tax,
 * derived straight from the `payment-stripe` step's `taxBehavior` config.
 *
 * Gated on `calculateTax` being configured (a real tax integration wired up
 * by the platform) so flows with no tax integration at all show nothing —
 * `taxBehavior` alone defaults to `"exclusive"` even when no one ever set it,
 * so using it as the gate would add noise to flows that never think about tax.
 */
export function taxBehaviorNote(
  flow: Flow,
  paymentStep: { calculateTax?: unknown; taxBehavior?: "inclusive" | "exclusive" } | undefined,
): string | undefined {
  if (!paymentStep?.calculateTax) return undefined
  return paymentStep.taxBehavior === "inclusive"
    ? resolveText(flow, "taxInclusiveNote")
    : resolveText(flow, "taxExclusiveNote")
}
