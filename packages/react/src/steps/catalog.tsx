import { useState } from "react"
import {
  asCatalogValue,
  catalogTotal,
  formatMoney,
  resolveText,
  resolveContentText,
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
import { taxBehaviorNote } from "./shared/tax-note"
import { SheetDialog } from "./shared/sheet-dialog"
import { useThemeRootRef } from "./shared/use-theme-root-ref"

function quantityOf(value: CatalogValue | null, itemValue: string): number {
  const line = value?.items.find((entry) => entry.value === itemValue)
  return line ? line.quantity : 0
}

function itemCap(step: CatalogStep, item: CatalogItem): number {
  return item.maxQuantity ?? step.maxPerItem
}

/** Bottom drawer on mobile, centered dialog from ~768px up — body markup for the
 *  catalog item detail sheet, shell provided by the shared `SheetDialog` (own
 *  `.fk-catalog-sheet-*` namespace). */
function CatalogItemSheetBody({
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
        <span className="fk-catalog-sheet-thumb">
          <StepImage image={item.image} size="badge" />
        </span>
      )}
      <h3 className="fk-catalog-sheet-title">
        <FlowMarkdown text={label} variant="inline" />
      </h3>
      <p className="fk-catalog-sheet-price">
        {item.price > 0 ? formatMoney(item.price, currency, locale) : "—"}
      </p>
      {details && (
        <div className="fk-catalog-sheet-details">
          <FlowMarkdown text={details} variant="block" />
        </div>
      )}
    </>
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
  const [rootRef, sheetContainer] = useThemeRootRef<HTMLDivElement>()
  const [openItem, setOpenItem] = useState<string | null>(null)
  // Filter selection is local display state (v2.43) — never part of the stored
  // `CatalogValue` answer, so it can't affect validation/total/report logic.
  const [activeTags, setActiveTags] = useState<string[]>([])
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

  function toggleTag(tag: string) {
    setActiveTags((tags) => (tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]))
  }

  // No filter active → every item shows (today's behavior, unchanged). At least one
  // active → OR match: an item with no `tags` (or none matching) drops out.
  const visibleItems =
    activeTags.length === 0
      ? step.items
      : step.items.filter((item) => item.tags?.some((tag) => activeTags.includes(tag)))

  const title = step.title !== undefined ? resolveContentText(flow, step.title) : undefined
  const subtitle = step.subtitle !== undefined ? resolveContentText(flow, step.subtitle) : undefined

  return (
    <div className="fk-step fk-step-catalog" ref={rootRef}>
      <StepTitle image={step.image} title={title} />
      {subtitle && (
        <p className="fk-subtitle">
          <FlowMarkdown text={subtitle} variant="block" />
        </p>
      )}

      {step.filters && step.filters.length > 0 && (
        <div className="fk-catalog-filter-row" role="group" aria-label={resolveText(flow, "catalogFilters")}>
          {step.filters.map((filter) => {
            const active = activeTags.includes(filter.tag)
            const filterLabel = resolveContentText(flow, filter.label)
            return (
              <button
                key={filter.tag}
                type="button"
                className={`fk-catalog-filter-chip ${active ? "fk-catalog-filter-chip-selected" : ""}`}
                aria-pressed={active}
                onClick={() => toggleTag(filter.tag)}
              >
                {filter.icon && <StepImage image={filter.icon} size="catalog-filter" />}
                <FlowMarkdown text={filterLabel} variant="inline" />
              </button>
            )
          })}
        </div>
      )}

      <ul className="fk-catalog-list" onBlur={handleBlur} {...ariaProps}>
        {visibleItems.length === 0 && (
          <li className="fk-catalog-filter-empty">{resolveText(flow, "catalogFilterEmpty")}</li>
        )}
        {visibleItems.map((item) => {
          const quantity = quantityOf(current, item.value)
          const cap = itemCap(step, item)
          const expandable = Boolean(item.details)
          const label = resolveContentText(flow, item.label)
          const description = item.description !== undefined ? resolveContentText(flow, item.description) : undefined
          const body = (
            <>
              <span className="fk-catalog-label">
                <FlowMarkdown text={label} variant="inline" />
                {expandable && <span className="fk-catalog-more" aria-hidden="true">ⓘ</span>}
              </span>
              {description && (
                <span className="fk-catalog-description">
                  <FlowMarkdown text={description} variant="block" />
                </span>
              )}
              <span className="fk-catalog-price">
                {item.price > 0 ? formatMoney(item.price, step.currency, flow.locale) : "—"}
                {item.price > 0 && priceNote && <span className="fk-catalog-price-note">{priceNote}</span>}
              </span>
            </>
          )
          return (
            <li
              key={item.value}
              className={`fk-catalog-item ${quantity > 0 ? "fk-catalog-item-active" : ""}`}
            >
              {item.image && <StepImage image={item.image} size="product-thumb" />}
              {expandable ? (
                <button
                  type="button"
                  className="fk-catalog-body fk-catalog-body-button"
                  onClick={() => setOpenItem(item.value)}
                  aria-label={`${label} — ${resolveText(flow, "catalogDetails")}`}
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
        <SheetDialog
          namespace="fk-catalog-sheet"
          ariaLabel={resolveContentText(flow, activeItem.label)}
          closeLabel={resolveText(flow, "catalogClose")}
          container={sheetContainer}
          onClose={() => setOpenItem(null)}
        >
          <CatalogItemSheetBody
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
