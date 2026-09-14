import { formatMoney } from "@flowkit-io/core"
import type { OrderSummary } from "@flowkit-io/core"
import { FlowMarkdown } from "../../markdown"
import { StepImage } from "./step-image"

/** Fallback per-line icon for lines with no `image` (every `"fee"` line, and any
 *  catalog/product item that didn't set one) — plain "package" placeholder. */
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
 * `catalog`/`product` steps mid-flow) — thumb/label/quantity/line amount + total.
 * Deliberately dumber than `review.tsx`'s `OrderSummaryTable`: no tax section, since
 * tax is only computed once the flow's `address` step has been answered and this
 * panel can be opened well before that. Kept as its own component (rather than reusing
 * `OrderSummaryTable` with the tax bits hidden) to avoid any risk of regressing the
 * already-tested review step.
 *
 * Layout is design-review variant "#2 — Con miniatura" (see DECISIONS.md): flat rows
 * (no per-row card background/divider), thumb + stacked name/unit-price on the left,
 * a quantity pill in the middle, line amount on the right; total is a plain row under
 * a top border, not a full-bleed banner.
 *
 * `"item"` lines (real catalog/product rows, real quantity — see `OrderSummaryLine`
 * in catalog-step.ts) get +/-/remove controls so the cart doubles as an editor, not
 * just a recap, and show the per-unit price under the name. `"fee"` lines (priced
 * options on select-cards/multi-select/radio/chips, or the payment step's flat
 * surcharge) stay plain — no quantity concept, no per-unit price (their amount IS
 * the unit price).
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
                {line.image ? <StepImage image={line.image} size="cart-thumb" /> : <LineIcon />}
              </span>
              <span className="fk-cart-summary-main">
                <span className="fk-cart-summary-name">
                  <FlowMarkdown text={line.label} variant="inline" />
                </span>
                {line.kind === "item" && (
                  <span className="fk-cart-summary-unit">
                    {formatMoney(line.unitAmount, summary.currency, locale)} / cad.
                  </span>
                )}
              </span>
              {line.kind === "item" && (
                <span className="fk-cart-summary-qty-pill">
                  <button
                    type="button"
                    className="fk-cart-summary-qty-btn"
                    aria-label={line.quantity <= 1 ? removeLabel : decreaseLabel}
                    onClick={() => onLineQuantityChange(line.stepId, line.value, line.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="fk-cart-summary-qty-value" aria-live="polite">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    className="fk-cart-summary-qty-btn"
                    aria-label={increaseLabel}
                    disabled={atCap}
                    onClick={() => onLineQuantityChange(line.stepId, line.value, line.quantity + 1)}
                  >
                    +
                  </button>
                </span>
              )}
              <span className="fk-cart-summary-price">
                {formatMoney(line.amount, summary.currency, locale)}
              </span>
            </li>
          )
        })}
      </ul>
      <div className="fk-cart-summary-total">
        <span className="fk-cart-summary-total-label">
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
