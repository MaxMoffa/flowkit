import { useState, type ComponentType } from "react"
import type { OrderSummary } from "@flowkit-io/core"
import type { ProgressComponentProps } from "./progress-registry"
import { FlowMarkdown } from "./markdown"
import { SheetDialog } from "./steps/shared/sheet-dialog"
import { useThemeRootRef } from "./steps/shared/use-theme-root-ref"
import { CartSummaryList } from "./steps/shared/cart-summary-list"

interface FooterShellProps {
  order: number
  /** Attached to the root `.fk-footer` element so a `SheetDialog` opened from this
   *  footer (the cart panel) can find its nearest `.fk-theme` ancestor to portal into —
   *  same pattern as `catalog.tsx`/`product.tsx`'s own sheets. */
  rootRef?: React.Ref<HTMLDivElement>
  children: React.ReactNode
}

function FooterShell({ order, rootRef, children }: FooterShellProps) {
  return (
    <div className="fk-footer" style={{ order }} ref={rootRef}>
      <div className="fk-footer-inner">{children}</div>
    </div>
  )
}

/** Cart trigger button: 🛒 with an optional item-count badge. Rendered twice by
 *  `StepFooter` — once inside `.fk-footer-row` (mobile, next to the primary button)
 *  and once inside `.fk-footer-order-total` (desktop, next to the total) — CSS alone
 *  decides which is visible at a given width (same dual-render pattern as the header
 *  vs. footer "back" button). */
function CartTriggerButton({
  className,
  count,
  ariaLabel,
  onClick,
}: {
  className: string
  count: number
  ariaLabel: string
  onClick: () => void
}) {
  return (
    <button type="button" className={`fk-footer-cart ${className}`} aria-label={ariaLabel} onClick={onClick}>
      <span aria-hidden="true">🛒</span>
      {count > 0 && <span className="fk-footer-cart-badge">{count}</span>}
    </button>
  )
}

export interface FooterCartInfo {
  summary: OrderSummary
  /** Total quantity across item lines, shown as the trigger button's badge. */
  count: number
  locale: string
  totalLabel: string
  /** Accessible label for the trigger button and the panel's dialog title. */
  openLabel: string
  closeLabel: string
  /** Resolved once here (`resolveText(flow, "catalogDecrease"|"catalogIncrease"|"catalogRemove")`)
   *  so `CartSummaryList` stays a plain string renderer, same pattern as `totalLabel`. */
  decreaseLabel: string
  increaseLabel: string
  removeLabel: string
  /** Quantity ceiling per `"item"` line, keyed by `${stepId}::${value}` — lets the
   *  panel disable "+" at the same cap the source step enforces. */
  lineCaps: Map<string, number>
  /** Writes a new quantity back to the source `catalog`/`product` step (0 = remove
   *  the line). No-op for `"fee"` lines — the panel never calls this for them. */
  onLineQuantityChange: (stepId: string, itemValue: string, quantity: number) => void
  /** Discreet "+ IVA" / "IVA inclusa" hint (see `steps/shared/tax-note.ts`) — `undefined`
   *  when the flow has no real tax integration wired up (no `calculateTax`). */
  taxNote?: string
}

interface StepFooterProps {
  order: number
  /** Hidden on intro, which has no back navigation and no step counter. */
  showBack: boolean
  backDisabled: boolean
  onBack: () => void
  backLabel: string
  primaryLabel: string
  primaryDisabled: boolean
  /** The review step's primary button doubles as the submit action. */
  isSubmit: boolean
  onPrimary: () => void
  /** Message from a rejected submit (e.g. a failed deferred payment), shown above the row. */
  error?: string | null
  /** Small print under the primary button (intro step's `ctaFootnote` — e.g. a
   *  platform disclaimer). Restricted markdown, so a link is allowed. */
  footnote?: string | null
  /** Running order total (catalog items + priced options), shown as a plain line just
   *  above the button row on every step once the order is non-empty. Both strings are
   *  already localized. */
  orderTotal?: { label: string; amount: string; taxNote?: string } | null
  /** Cart recap panel data — present under the exact same condition as `orderTotal`
   *  (non-empty cart). When set, a 🛒 trigger button appears next to the primary
   *  button on mobile and next to the total on desktop, opening a drawer/dialog with
   *  the itemized recap (`CartSummaryList`). */
  cart?: FooterCartInfo | null
  progress: { Component: ComponentType<ProgressComponentProps> | null; show: boolean } & ProgressComponentProps
}

/** Footer of every step but the last: optional progress bar, back, primary action. */
export function StepFooter({
  order,
  showBack,
  backDisabled,
  onBack,
  backLabel,
  primaryLabel,
  primaryDisabled,
  isSubmit,
  onPrimary,
  error,
  footnote,
  orderTotal,
  cart,
  progress,
}: StepFooterProps) {
  const { Component: ProgressComponent, show, ...progressProps } = progress
  const [cartOpen, setCartOpen] = useState(false)
  const [rootRef, sheetContainer] = useThemeRootRef<HTMLDivElement>()
  // Count appended to the accessible name (not just shown visually in the badge) so a
  // screen reader announces "Carrello (2)" rather than just "Carrello".
  const cartAriaLabel = cart ? (cart.count > 0 ? `${cart.openLabel} (${cart.count})` : cart.openLabel) : ""
  return (
    <FooterShell order={order} rootRef={rootRef}>
      {ProgressComponent && show && (
        <div className="fk-footer-progress">
          <ProgressComponent {...progressProps} />
        </div>
      )}
      {error && (
        <p className="fk-footer-error" role="alert">
          {error}
        </p>
      )}
      {orderTotal && (
        <div className="fk-footer-order-total">
          {cart && (
            <CartTriggerButton
              className="fk-footer-cart-total"
              count={cart.count}
              ariaLabel={cartAriaLabel}
              onClick={() => setCartOpen(true)}
            />
          )}
          <span>{orderTotal.label}</span>
          <span className="fk-footer-order-total-amount">{orderTotal.amount}</span>
          {orderTotal.taxNote && <span className="fk-footer-order-total-tax-note">{orderTotal.taxNote}</span>}
        </div>
      )}
      <div className="fk-footer-row">
        {showBack && (
          <button type="button" className="fk-footer-back" onClick={onBack} disabled={backDisabled}>
            ← {backLabel}
          </button>
        )}
        {cart ? (
          // Only wrapped in this extra row when a cart trigger needs to sit beside it
          // — plain sibling of `.fk-footer-back` otherwise (see below), unchanged from
          // before this button existed: an unconditional wrapper here would give the
          // primary button a different padding/flex-basis floor than `.fk-footer-back`
          // (border-box padding isn't part of the flex-basis:0% "free space" split),
          // throwing off their equal-width split on desktop.
          <div className="fk-footer-primary-row">
            <CartTriggerButton
              className="fk-footer-cart-row"
              count={cart.count}
              ariaLabel={cartAriaLabel}
              onClick={() => setCartOpen(true)}
            />
            <button
              type="button"
              className={`fk-btn-primary ${isSubmit ? "fk-btn-success" : ""}`}
              disabled={primaryDisabled}
              onClick={onPrimary}
            >
              <FlowMarkdown text={primaryLabel} variant="inline" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`fk-btn-primary ${isSubmit ? "fk-btn-success" : ""}`}
            disabled={primaryDisabled}
            onClick={onPrimary}
          >
            <FlowMarkdown text={primaryLabel} variant="inline" />
          </button>
        )}
      </div>
      {footnote && (
        <div className="fk-footer-note">
          <FlowMarkdown text={footnote} variant="block" />
        </div>
      )}
      {cartOpen && cart && sheetContainer && (
        <SheetDialog
          namespace="fk-cart-sheet"
          ariaLabel={cart.openLabel}
          closeLabel={cart.closeLabel}
          container={sheetContainer}
          onClose={() => setCartOpen(false)}
        >
          <h3 className="fk-cart-sheet-title">{cart.openLabel}</h3>
          <CartSummaryList
            summary={cart.summary}
            locale={cart.locale}
            totalLabel={cart.totalLabel}
            decreaseLabel={cart.decreaseLabel}
            increaseLabel={cart.increaseLabel}
            removeLabel={cart.removeLabel}
            lineCaps={cart.lineCaps}
            onLineQuantityChange={cart.onLineQuantityChange}
            taxNote={cart.taxNote}
          />
        </SheetDialog>
      )}
    </FooterShell>
  )
}

interface ConfirmationFooterProps {
  order: number
  secondaryLabel: string
  showSecondary: boolean
  onSecondary: () => void
  primaryLabel: string
  showPrimary: boolean
  onPrimary: () => void
}

/** Footer of the confirmation step: restart and go-home, no progress, no back. */
export function ConfirmationFooter({
  order,
  secondaryLabel,
  showSecondary,
  onSecondary,
  primaryLabel,
  showPrimary,
  onPrimary,
}: ConfirmationFooterProps) {
  return (
    <FooterShell order={order}>
      <div className="fk-footer-row">
        {showSecondary && (
          <button type="button" className="fk-btn-secondary" onClick={onSecondary}>
            <FlowMarkdown text={secondaryLabel} variant="inline" />
          </button>
        )}
        {showPrimary && (
          <button type="button" className="fk-btn-primary" onClick={onPrimary}>
            <FlowMarkdown text={primaryLabel} variant="inline" />
          </button>
        )}
      </div>
    </FooterShell>
  )
}
