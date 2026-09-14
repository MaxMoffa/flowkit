import { formatMoney } from "@flowkit-io/core"
import type { OrderSummary } from "@flowkit-io/core"
import { FlowMarkdown } from "../../markdown"

/** Generic per-line icon — `OrderSummaryLine` carries no per-item image (`buildOrderSummary`
 *  is deliberately structural/source-agnostic across catalog/product/select-cards/etc.), so
 *  this is a plain "package" placeholder rather than a real product thumbnail. */
function LineIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  )
}

/**
 * Simple recap of the cart's order lines for the footer's cart panel (opened from
 * `catalog`/`product` steps mid-flow) — icon/label/quantity/line amount + total.
 * Deliberately dumber than `review.tsx`'s `OrderSummaryTable`: no tax section, since
 * tax is only computed once the flow's `address` step has been answered and this
 * panel can be opened well before that. Kept as its own component (rather than reusing
 * `OrderSummaryTable` with the tax bits hidden) to avoid any risk of regressing the
 * already-tested review step.
 *
 * `"item"` lines (real catalog/product rows, real quantity — see `OrderSummaryLine`
 * in catalog-step.ts) get +/-/remove controls so the cart doubles as an editor, not
 * just a recap. `"fee"` lines (priced options on select-cards/multi-select/radio/chips,
 * or the payment step's flat surcharge) stay plain text — no quantity concept to edit
 * from here. One row per line (label, controls, amount, all inline) — picked from a
 * design review comparing several treatments, see DECISIONS.md.
 */
export function CartSummaryList({
  summary,
  locale,
  totalLabel,
  decreaseLabel,
  increaseLabel,
  removeLabel,
  lineCaps,
  onLineQuantityChange,
  taxNote,
}: {
  summary: OrderSummary
  locale: string
  totalLabel: string
  /** Discreet "+ IVA" / "IVA inclusa" hint (see `steps/shared/tax-note.ts`) —
   *  `undefined` when the flow has no real tax integration wired up. */
  taxNote?: string
  /** Resolved once by the caller (`flow-runner.tsx`'s `cart` useMemo) — this component
   *  stays a plain string renderer, no `flow` dependency of its own (same pattern as
   *  `totalLabel`). */
  decreaseLabel: string
  increaseLabel: string
  removeLabel: string
  /** Quantity ceiling per `"item"` line, keyed by `${stepId}::${value}`. */
  lineCaps: Map<string, number>
  onLineQuantityChange: (stepId: string, itemValue: string, quantity: number) => void
}) {
  return (
    <div className="fk-cart-summary">
      <ul className="fk-cart-summary-lines">
        {summary.lines.map((line, index) => {
          const cap = lineCaps.get(`${line.stepId}::${line.value}`)
          const atCap = cap !== undefined && line.quantity >= cap
          return (
            <li key={`${line.stepId}-${line.value}-${index}`} className="fk-cart-summary-line">
              <span className="fk-cart-summary-thumb" aria-hidden="true">
                <LineIcon />
              </span>
              <span className="fk-cart-summary-line-label">
                <FlowMarkdown text={line.label} variant="inline" />
              </span>
              {line.kind === "item" && (
                <span className="fk-cart-summary-controls">
                  <span className="fk-cart-summary-stepper">
                    <button
                      type="button"
                      className="fk-cart-summary-step"
                      aria-label={decreaseLabel}
                      onClick={() => onLineQuantityChange(line.stepId, line.value, line.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="fk-cart-summary-qty-value" aria-live="polite">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className="fk-cart-summary-step"
                      aria-label={increaseLabel}
                      disabled={atCap}
                      onClick={() => onLineQuantityChange(line.stepId, line.value, line.quantity + 1)}
                    >
                      +
                    </button>
                  </span>
                  <button
                    type="button"
                    className="fk-cart-summary-remove"
                    aria-label={removeLabel}
                    onClick={() => onLineQuantityChange(line.stepId, line.value, 0)}
                  >
                    <span aria-hidden="true">🗑</span>
                  </button>
                </span>
              )}
              <span className="fk-cart-summary-line-amount">
                {formatMoney(line.amount, summary.currency, locale)}
              </span>
            </li>
          )
        })}
      </ul>
      <div className="fk-cart-summary-total">
        <span>
          {totalLabel}
          {taxNote && <span className="fk-cart-summary-total-tax-note">{taxNote}</span>}
        </span>
        <span className="fk-cart-summary-total-amount">
          {formatMoney(summary.total, summary.currency, locale)}
        </span>
      </div>
    </div>
  )
}
