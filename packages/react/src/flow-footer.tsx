import { useRef, useState, type ComponentType } from "react"
import type { OrderSummary } from "@flowkit-io/core"
import type { ProgressComponentProps } from "./progress-registry"
import { FlowMarkdown } from "./markdown"
import { SheetDialog } from "./steps/shared/sheet-dialog"
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

/** Cart trigger button: 🛒 with an optional item-count badge, next to the primary
 *  button (see `.fk-footer-primary-row`) — the only place the running total is shown
 *  at all (opens the itemized recap panel), the footer no longer prints a plain total
 *  line of its own. */
function CartTriggerButton({
  count,
  ariaLabel,
  onClick,
}: {
  count: number
  ariaLabel: string
  onClick: () => void
}) {
  return (
    <button type="button" className="fk-footer-cart" aria-label={ariaLabel} onClick={onClick}>
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
  /** Cart recap panel data — present once the order is non-empty. When set, a 🛒
   *  trigger button appears next to the primary button, opening a drawer/dialog with
   *  the itemized recap (`CartSummaryList`) — the only place the running total shows,
   *  the footer itself no longer prints a plain total line. */
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
  cart,
  progress,
}: StepFooterProps) {
  const { Component: ProgressComponent, show, ...progressProps } = progress
  const [cartOpen, setCartOpen] = useState(false)
  // Portal target for the cart panel (see its render below) — `.fk-footer` itself,
  // not the usual nearest-`.fk-theme` lookup `useThemeRootRef` gives every other
  // `SheetDialog` caller: the cart popover positions itself against this exact box.
  const rootRef = useRef<HTMLDivElement>(null)
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
            <CartTriggerButton count={cart.count} ariaLabel={cartAriaLabel} onClick={() => setCartOpen(true)} />
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
      {cartOpen && cart && rootRef.current && (
        // Portals into `.fk-footer` itself (not the usual `.fk-theme` root every
        // other SheetDialog uses) — on desktop (>=1024px) the panel renders as a
        // contextual popover anchored above the cart trigger instead of a centered
        // modal (see style.css's `.fk-cart-sheet-root`/`.fk-cart-sheet` desktop
        // overrides), which needs `.fk-footer`'s own box (it's `position: relative`
        // there) as the positioning context. Below 1024px this is still the exact
        // same full-page bottom sheet as before — `.fk-cart-sheet-root` stays
        // `position: fixed; inset: 0`, unaffected by which element it's portaled
        // into (its containing block is `.fk-root`'s `container-type` ancestor
        // either way, see DECISIONS.md).
        <SheetDialog
          namespace="fk-cart-sheet"
          ariaLabel={cart.openLabel}
          closeLabel={cart.closeLabel}
          container={rootRef.current}
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
