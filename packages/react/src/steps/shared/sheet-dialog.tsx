import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"

/**
 * Shared bottom-sheet/dialog shell: bottom drawer under 768px, centered dialog from
 * 768px up, closes on ✕/backdrop/Esc/grabber, focuses itself on mount, portals into
 * `container` (the `.fk-theme` root, so CSS custom properties still resolve).
 *
 * Extracted from the near-identical `CatalogItemSheet` (catalog.tsx) and
 * `ProductItemSheet` (product.tsx) — this is the shell only; every caller supplies
 * its own body markup via `children` and its own CSS namespace via `namespace`
 * (e.g. `"fk-catalog-sheet"`, `"fk-product-sheet"`, `"fk-cart-sheet"`) so existing
 * class names — and the tests/styles that key off them — don't change.
 */
export function SheetDialog({
  namespace,
  ariaLabel,
  closeLabel,
  container,
  onClose,
  children,
}: {
  /** CSS class prefix, e.g. `"fk-product-sheet"`. Produces `${namespace}-root`,
   *  `${namespace}-backdrop`, `${namespace}` (the panel itself), `${namespace}-grabber`,
   *  `${namespace}-close`, `${namespace}-body`. */
  namespace: string
  ariaLabel: string
  closeLabel: string
  container: HTMLElement
  onClose: () => void
  children: React.ReactNode
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
    <div className={`${namespace}-root`}>
      <div className={`${namespace}-backdrop`} onClick={onClose} />
      <div
        ref={sheetRef}
        className={namespace}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
      >
        <div className={`${namespace}-grabber`} aria-hidden="true" onClick={onClose} />
        <button type="button" className={`${namespace}-close`} aria-label={closeLabel} onClick={onClose}>
          ✕
        </button>
        <div className={`${namespace}-body`}>{children}</div>
      </div>
    </div>,
    container,
  )
}
