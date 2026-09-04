import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  asCatalogValue,
  catalogTotal,
  formatMoney,
  resolveText,
  type CalculateTax,
  type CatalogItem,
  type CatalogStep,
  type CatalogValue,
} from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"
import { StepImage } from "./shared/step-image"
import { useFieldValidation } from "./shared/use-field-validation"
import { FieldError } from "./shared/field-error"
import { useTaxCalculation } from "./shared/use-tax-calculation"

function quantityOf(value: CatalogValue | null, itemValue: string): number {
  const line = value?.items.find((entry) => entry.value === itemValue)
  return line ? line.quantity : 0
}

function itemCap(step: CatalogStep, item: CatalogItem): number {
  return item.maxQuantity ?? step.maxPerItem
}

/** Bottom drawer on mobile, centered dialog from ~768px up (the switch is pure CSS —
 *  see `.fk-catalog-sheet`). Rendered in a portal so it escapes the step's clipping. */
function CatalogItemSheet({
  item,
  currency,
  locale,
  closeLabel,
  container,
  onClose,
}: {
  item: CatalogItem
  currency: string
  locale: string
  closeLabel: string
  container: HTMLElement
  onClose: () => void
}) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    sheetRef.current?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  return createPortal(
    <div className="fk-catalog-sheet-root">
      <div className="fk-catalog-sheet-backdrop" onClick={onClose} />
      <div
        ref={sheetRef}
        className="fk-catalog-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={item.label}
        tabIndex={-1}
      >
        <div className="fk-catalog-sheet-grabber" aria-hidden="true" onClick={onClose} />
        <button
          type="button"
          className="fk-catalog-sheet-close"
          aria-label={closeLabel}
          onClick={onClose}
        >
          ✕
        </button>
        <div className="fk-catalog-sheet-body">
          {item.image && (
            <span className="fk-catalog-sheet-thumb">
              <StepImage image={item.image} size="badge" />
            </span>
          )}
          <h3 className="fk-catalog-sheet-title">
            <FlowMarkdown text={item.label} variant="inline" />
          </h3>
          <p className="fk-catalog-sheet-price">
            {item.price > 0 ? formatMoney(item.price, currency, locale) : "—"}
          </p>
          {item.details && (
            <div className="fk-catalog-sheet-details">
              <FlowMarkdown text={item.details} variant="block" />
            </div>
          )}
        </div>
      </div>
    </div>,
    container,
  )
}

export function CatalogStepView({
  step,
  value,
  onChange,
  flow,
  answers,
  meta,
  validationAttempt,
  estimatedAddress,
}: StepComponentProps<CatalogStep>) {
  const current = asCatalogValue(value)
  const rootRef = useRef<HTMLDivElement>(null)
  const [openItem, setOpenItem] = useState<string | null>(null)
  const { message, errorId, handleBlur, ariaProps } = useFieldValidation(
    step,
    value,
    flow,
    answers,
    meta,
    validationAttempt,
  )

  // Same seam the `review` step uses (`calculateTax` on the flow's `payment-stripe`
  // step). Here it usually runs before the flow's own `address` step has been
  // answered, so it leans on `estimatedAddress` (host-provided, e.g. an IP-based
  // country) and the result is labeled as an estimate — same pattern storefronts
  // like Amazon use to show a tax-aware price pre-checkout, without an account.
  const paymentStep = flow.steps.find((s) => s.type === "payment-stripe") as
    | { calculateTax?: CalculateTax; taxBehavior?: "inclusive" | "exclusive" }
    | undefined
  const hasItems = Boolean(current && current.items.length > 0)
  const tax = useTaxCalculation(
    flow,
    answers,
    paymentStep?.calculateTax,
    paymentStep?.taxBehavior ?? "exclusive",
    hasItems,
    estimatedAddress,
  )

  function setQuantity(itemValue: string, quantity: number) {
    const others = (current?.items ?? []).filter((line) => line.value !== itemValue)
    const items = quantity > 0 ? [...others, { value: itemValue, quantity }] : others
    // Keep line order stable (config order) so the report row reads predictably.
    const ordered = step.items
      .map((item) => items.find((line) => line.value === item.value))
      .filter((line): line is { value: string; quantity: number } => line !== undefined)
    const next: CatalogValue = { items: ordered, total: 0 }
    next.total = catalogTotal(step, next)
    onChange(ordered.length > 0 ? next : null)
  }

  const activeItem = openItem ? step.items.find((item) => item.value === openItem) : undefined

  // Portal the sheet into the theme root (`.fk-theme`, set by ThemeProvider) so its
  // CSS custom properties resolve — `document.body` would strip the theme.
  const sheetContainer =
    rootRef.current?.closest<HTMLElement>(".fk-theme") ??
    (typeof document !== "undefined" ? document.body : null)

  return (
    <div className="fk-step fk-step-catalog" ref={rootRef}>
      <StepTitle image={step.image} title={step.title} />
      {step.subtitle && (
        <p className="fk-subtitle">
          <FlowMarkdown text={step.subtitle} variant="block" />
        </p>
      )}

      <ul className="fk-catalog-list" onBlur={handleBlur} {...ariaProps}>
        {step.items.map((item) => {
          const quantity = quantityOf(current, item.value)
          const cap = itemCap(step, item)
          const expandable = Boolean(item.details)
          const body = (
            <>
              <span className="fk-catalog-label">
                <FlowMarkdown text={item.label} variant="inline" />
                {expandable && <span className="fk-catalog-more" aria-hidden="true">ⓘ</span>}
              </span>
              {item.description && (
                <span className="fk-catalog-description">
                  <FlowMarkdown text={item.description} variant="block" />
                </span>
              )}
              <span className="fk-catalog-price">
                {item.price > 0 ? formatMoney(item.price, step.currency, flow.locale) : "—"}
              </span>
            </>
          )
          return (
            <li
              key={item.value}
              className={`fk-catalog-item ${quantity > 0 ? "fk-catalog-item-active" : ""}`}
            >
              {item.image && (
                <span className="fk-catalog-thumb">
                  <StepImage image={item.image} size="review" />
                </span>
              )}
              {expandable ? (
                <button
                  type="button"
                  className="fk-catalog-body fk-catalog-body-button"
                  onClick={() => setOpenItem(item.value)}
                  aria-label={`${item.label} — ${resolveText(flow, "catalogDetails")}`}
                >
                  {body}
                </button>
              ) : (
                <span className="fk-catalog-body">{body}</span>
              )}

              {quantity === 0 ? (
                <button
                  type="button"
                  className="fk-catalog-add"
                  onClick={() => setQuantity(item.value, 1)}
                >
                  {resolveText(flow, "catalogAdd")}
                </button>
              ) : (
                <span className="fk-catalog-stepper">
                  <button
                    type="button"
                    className="fk-catalog-step"
                    aria-label={resolveText(flow, "catalogDecrease")}
                    onClick={() => setQuantity(item.value, quantity - 1)}
                  >
                    −
                  </button>
                  <span className="fk-catalog-qty" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="fk-catalog-step"
                    aria-label={resolveText(flow, "catalogIncrease")}
                    disabled={quantity >= cap}
                    onClick={() => setQuantity(item.value, Math.min(cap, quantity + 1))}
                  >
                    +
                  </button>
                </span>
              )}
            </li>
          )
        })}
      </ul>

      {hasItems && tax.status === "loading" && (
        <p className="fk-catalog-tax-note">{resolveText(flow, "taxCalculating")}</p>
      )}
      {hasItems && tax.status === "done" && (
        <p className="fk-catalog-tax-note">
          {tax.addressSource === "estimated"
            ? `${resolveText(flow, "taxLabel")} · ${resolveText(flow, "taxEstimated")}`
            : resolveText(flow, "taxLabel")}
          : {formatMoney(tax.result.taxAmount, tax.result.currency, flow.locale)}
          {" · "}
          {resolveText(flow, "catalogEstimatedTotal")}:{" "}
          {formatMoney(tax.result.totalWithTax, tax.result.currency, flow.locale)}
        </p>
      )}

      <FieldError id={errorId} message={message} />

      {activeItem && sheetContainer && (
        <CatalogItemSheet
          item={activeItem}
          currency={step.currency}
          locale={flow.locale}
          closeLabel={resolveText(flow, "catalogClose")}
          container={sheetContainer}
          onClose={() => setOpenItem(null)}
        />
      )}
    </div>
  )
}
