import { useState } from "react"
import {
  asCatalogValue,
  catalogTotal,
  formatMoney,
  resolveText,
  resolveContentText,
  type CalculateTax,
  type CatalogItem,
  type CatalogValue,
  type ProductStep,
} from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"
import { StepImage } from "./shared/step-image"
import { useFieldValidation } from "./shared/use-field-validation"
import { FieldError } from "./shared/field-error"
import { useTaxCalculation } from "./shared/use-tax-calculation"
import { taxBehaviorNote } from "./shared/tax-note"
import { SheetDialog } from "./shared/sheet-dialog"
import { useThemeRootRef } from "./shared/use-theme-root-ref"

function quantityOf(value: CatalogValue | null, itemValue: string): number {
  const line = value?.items.find((entry) => entry.value === itemValue)
  return line ? line.quantity : 0
}

function itemCap(step: ProductStep, item: CatalogItem): number {
  return item.maxQuantity ?? step.maxPerItem
}

/** Bottom drawer on mobile, centered dialog from ~768px up — body markup for the
 *  product item detail sheet, shell provided by the shared `SheetDialog` (own
 *  `.fk-product-sheet-*` namespace so the `catalog`/`product` steps' styles don't
 *  couple). */
function ProductItemSheetBody({
  item,
  label,
  details,
  currency,
  locale,
}: {
  item: CatalogItem
  /** Resolved via `resolveContentText` at the call site — this component stays a
   *  plain string renderer, no `flow` dependency of its own. */
  label: string
  details?: string
  currency: string
  locale: string
}) {
  return (
    <>
      {item.image && (
        <span className="fk-product-sheet-thumb">
          <StepImage image={item.image} size="badge" />
        </span>
      )}
      <h3 className="fk-product-sheet-title">
        <FlowMarkdown text={label} variant="inline" />
      </h3>
      <p className="fk-product-sheet-price">
        {item.price > 0 ? formatMoney(item.price, currency, locale) : "—"}
      </p>
      {details && (
        <div className="fk-product-sheet-details">
          <FlowMarkdown text={details} variant="block" />
        </div>
      )}
    </>
  )
}

/**
 * "product" step: hero showcase for 1-4 items (see product-step.ts for why it's a
 * separate type from `catalog` rather than a layout variant). Renders every item as
 * the same large hero card, stacked vertically — a single item gets an extra `-solo`
 * modifier class for a bigger image/title, matching the "one big product page" feel;
 * 2-4 items get the identical card design in a plain vertical list, not a grid.
 */
export function ProductStepView({
  step,
  value,
  onChange,
  flow,
  answers,
  meta,
  validationAttempt,
  estimatedAddress,
}: StepComponentProps<ProductStep>) {
  const current = asCatalogValue(value)
  const [rootRef, sheetContainer] = useThemeRootRef<HTMLDivElement>()
  const [openItem, setOpenItem] = useState<string | null>(null)
  const { message, errorId, handleBlur, ariaProps } = useFieldValidation(
    step,
    value,
    flow,
    answers,
    meta,
    validationAttempt,
  )

  // Same tax-estimate seam the `catalog` step uses (see catalog.tsx): a
  // `payment-stripe` step's `calculateTax`, run against `estimatedAddress` when the
  // flow's own `address` step hasn't been answered yet.
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
  const priceNote = taxBehaviorNote(flow, paymentStep)

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

  const solo = step.items.length === 1
  const title = step.title !== undefined ? resolveContentText(flow, step.title) : undefined
  const subtitle = step.subtitle !== undefined ? resolveContentText(flow, step.subtitle) : undefined

  return (
    <div className="fk-step fk-step-product" ref={rootRef}>
      <StepTitle image={step.image} title={title} />
      {subtitle && (
        <p className="fk-subtitle">
          <FlowMarkdown text={subtitle} variant="block" />
        </p>
      )}

      <ul className="fk-product-list" onBlur={handleBlur} {...ariaProps}>
        {step.items.map((item) => {
          const quantity = quantityOf(current, item.value)
          const cap = itemCap(step, item)
          const expandable = Boolean(item.details)
          const label = resolveContentText(flow, item.label)
          const description = item.description !== undefined ? resolveContentText(flow, item.description) : undefined
          const cardBody = (
            <>
              <span className="fk-product-title">
                <FlowMarkdown text={label} variant="inline" />
                {expandable && <span className="fk-product-more" aria-hidden="true">ⓘ</span>}
              </span>
              {description && (
                <span className="fk-product-description">
                  <FlowMarkdown text={description} variant="block" />
                </span>
              )}
              <span className="fk-product-price">
                {item.price > 0 ? formatMoney(item.price, step.currency, flow.locale) : "—"}
                {item.price > 0 && priceNote && <span className="fk-product-price-note">{priceNote}</span>}
              </span>
            </>
          )
          return (
            <li
              key={item.value}
              className={`fk-product-card ${solo ? "fk-product-card-solo" : ""} ${
                quantity > 0 ? "fk-product-card-active" : ""
              }`}
            >
              {item.image && <StepImage image={item.image} size="product-hero" />}
              <div className="fk-product-card-body">
                {expandable ? (
                  <button
                    type="button"
                    className="fk-product-card-hit"
                    onClick={() => setOpenItem(item.value)}
                    aria-label={`${label} — ${resolveText(flow, "catalogDetails")}`}
                  >
                    {cardBody}
                  </button>
                ) : (
                  <div className="fk-product-card-hit">{cardBody}</div>
                )}

                {quantity === 0 ? (
                  <button
                    type="button"
                    className="fk-product-add"
                    onClick={() => setQuantity(item.value, 1)}
                  >
                    {resolveText(flow, "catalogAdd")}
                  </button>
                ) : (
                  <span className="fk-product-stepper">
                    <button
                      type="button"
                      className="fk-product-step"
                      aria-label={resolveText(flow, "catalogDecrease")}
                      onClick={() => setQuantity(item.value, quantity - 1)}
                    >
                      −
                    </button>
                    <span className="fk-product-qty" aria-live="polite">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      className="fk-product-step"
                      aria-label={resolveText(flow, "catalogIncrease")}
                      disabled={quantity >= cap}
                      onClick={() => setQuantity(item.value, Math.min(cap, quantity + 1))}
                    >
                      +
                    </button>
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {hasItems && tax.status === "loading" && (
        <p className="fk-product-tax-note">{resolveText(flow, "taxCalculating")}</p>
      )}
      {hasItems && tax.status === "done" && (
        <p className="fk-product-tax-note">
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
        <SheetDialog
          namespace="fk-product-sheet"
          ariaLabel={resolveContentText(flow, activeItem.label)}
          closeLabel={resolveText(flow, "catalogClose")}
          container={sheetContainer}
          onClose={() => setOpenItem(null)}
        >
          <ProductItemSheetBody
            item={activeItem}
            label={resolveContentText(flow, activeItem.label)}
            details={activeItem.details !== undefined ? resolveContentText(flow, activeItem.details) : undefined}
            currency={step.currency}
            locale={flow.locale}
          />
        </SheetDialog>
      )}
    </div>
  )
}
