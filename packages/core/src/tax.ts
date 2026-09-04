import type { Flow } from "./schema"
import type { Answers } from "./flow-state"
import { answerKey } from "./flow-state"
import { buildOrderSummary } from "./catalog-step"
import { asAddressValue, type AddressValue } from "./address-step"

/** One order line handed to the platform's tax calculation. */
export interface TaxLineInput {
  /** Stable id (`<stepId>:<value>`) so the platform can map results back. */
  reference: string
  /** Line total in `currency` minor units (unit price × quantity). */
  amount: number
  quantity: number
  /** Stripe tax code (`txcd_…`) when the catalog item set one. */
  taxCode?: string
}

export interface TaxCalculationInput {
  currency: string
  lines: TaxLineInput[]
  address: AddressValue
  /** Whether `amount`s already include tax (`"inclusive"`) or tax is added on top
   *  (`"exclusive"`). Mirrors Stripe's `tax_behavior`. */
  taxBehavior: "inclusive" | "exclusive"
  /** `"collected"` when `address` came from the visitor filling in the flow's own
   *  `address` step; `"estimated"` when no `address` step has been answered yet and
   *  it's the host page's `estimatedAddress` fallback instead (typically an IP-based
   *  country lookup, done server-side — FlowKit never guesses this itself). The
   *  platform still re-derives the authoritative charge server-side either way; this
   *  only tells the UI whether to caveat the number shown to the visitor. */
  addressSource: "collected" | "estimated"
}

export interface TaxBreakdownEntry {
  /** Human-readable label, e.g. `"IVA 22%"` or `"VAT (Ireland) 23%"`. */
  label: string
  /** Fractional rate, e.g. `0.22`. */
  rate: number
  /** Tax for this jurisdiction/rate, in minor units. */
  amount: number
}

export interface TaxCalculation {
  /** Total tax, minor units. */
  taxAmount: number
  /** Order total including tax, minor units. */
  totalWithTax: number
  currency: string
  breakdown: TaxBreakdownEntry[]
}

/**
 * Platform-injected on the `payment-stripe` step (never serialized — see the
 * `verifyToken` precedent). The platform calls Stripe's
 * `POST /v1/tax/calculations` on the flow owner's connected account and maps the
 * result into a `TaxCalculation`. FlowKit only displays what comes back; the
 * charge amount is always re-derived server-side, never trusted from the client.
 */
export type CalculateTax = (input: TaxCalculationInput) => Promise<TaxCalculation>

/**
 * Everything `calculateTax` needs, pulled from the flow's answers: the priced
 * order lines (`buildOrderSummary`) and an address. The first `address` step's
 * answer wins (`addressSource: "collected"`); when no `address` step has been
 * answered yet — e.g. the visitor is still on the `catalog` step, earlier in the
 * flow — falls back to `estimatedAddress` (`"estimated"`), the host page's
 * best-guess (typically the visitor's country from a server-side IP lookup — see
 * `FlowRunnerProps.estimatedAddress` in `@flowkit-io/react`). Returns `null` when
 * the order is empty, or neither a real nor an estimated address is available.
 */
export function buildTaxInput(
  flow: Flow,
  answers: Answers,
  taxBehavior: "inclusive" | "exclusive",
  estimatedAddress?: Partial<AddressValue>,
): TaxCalculationInput | null {
  const summary = buildOrderSummary(flow, answers)
  if (!summary) return null

  let collected: AddressValue | null = null
  for (const step of flow.steps) {
    if (step.type !== "address") continue
    collected = asAddressValue(answers[answerKey(step)])
    if (collected) break
  }

  const address = collected ?? asAddressValue(estimatedAddress)
  if (!address) return null

  return {
    currency: summary.currency,
    taxBehavior,
    address,
    addressSource: collected ? "collected" : "estimated",
    lines: summary.lines.map((line) => ({
      reference: `${line.stepId}:${line.value}`,
      amount: line.amount,
      quantity: line.quantity,
      taxCode: line.taxCode,
    })),
  }
}
