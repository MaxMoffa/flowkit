import { useEffect, useState } from "react"
import { buildTaxInput } from "@flowkit-io/core"
import type { AddressValue, CalculateTax, Flow, TaxCalculation } from "@flowkit-io/core"

export type TaxState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: TaxCalculation; addressSource: "collected" | "estimated" }
  | { status: "error" }

/**
 * Runs `calculateTax` once for the current order + address, re-running only when
 * the computed input actually changes (order lines, address, behavior). Shared by
 * the `review` step (address usually already collected by then) and the `catalog`
 * step (address usually not collected yet — relies on `estimatedAddress`, see
 * `FlowRunnerProps.estimatedAddress`). A single call per input snapshot, keyed on
 * a stringified digest so unrelated re-renders don't refire it.
 */
export function useTaxCalculation(
  flow: Flow,
  answers: Record<string, unknown>,
  calculateTax: CalculateTax | undefined,
  taxBehavior: "inclusive" | "exclusive",
  enabled: boolean,
  estimatedAddress?: Partial<AddressValue>,
): TaxState {
  const input =
    enabled && calculateTax ? buildTaxInput(flow, answers as never, taxBehavior, estimatedAddress) : null
  const key = input ? JSON.stringify(input) : null
  const [state, setState] = useState<TaxState>({ status: "idle" })

  useEffect(() => {
    if (!key || !input || !calculateTax) {
      setState({ status: "idle" })
      return
    }
    let cancelled = false
    setState({ status: "loading" })
    calculateTax(input)
      .then((result) => {
        if (!cancelled) setState({ status: "done", result, addressSource: input.addressSource })
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" })
      })
    return () => {
      cancelled = true
    }
    // `key` is the stable digest of `input`; re-run only when the order/address changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return state
}
