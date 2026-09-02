/** Indeterminate circular loading indicator. The ring's active arc is drawn in the
 *  active flow theme's accent colour (`--fk-accent`), so it always reads as part of the
 *  current theme. `compact` renders a smaller inline variant with the label beside it
 *  instead of below. Honours `prefers-reduced-motion` (see style.css). */
export function Spinner({ label, compact = false }: { label?: string; compact?: boolean }) {
  return (
    <div className={compact ? "fk-spinner-wrap fk-spinner-wrap-compact" : "fk-spinner-wrap"} role="status">
      <span className={compact ? "fk-spinner fk-spinner-sm" : "fk-spinner"} aria-hidden="true" />
      {label && <span className="fk-spinner-label">{label}</span>}
    </div>
  )
}
