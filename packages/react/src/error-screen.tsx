import { useEffect, useRef, type CSSProperties } from "react"
import type { ResolvedErrorAction, ResolvedErrorScreen } from "@flowkit-io/core"
import { FlowMarkdown } from "./markdown"
import { sanitizeStepIcon } from "./steps/shared/step-image"

/**
 * Full-screen generic error state, shown by FlowRunner outside the step flow (a
 * rejected review submit, or an imperative `ref.showError()`). Same visual shape as
 * the confirmation screen: a badge, title, message, then the resolved recovery
 * actions as a stacked button column (first = primary). `role="alert"` + focus moved
 * to the heading so a screen reader announces it on show.
 */
export function ErrorScreenView({
  resolved,
  onAction,
  className = "",
  style,
}: {
  resolved: ResolvedErrorScreen
  onAction: (resolved: ResolvedErrorAction) => void
  /** Theme animation class carried over from the flow (see `errorAnimationClass`). */
  className?: string
  style?: CSSProperties
}) {
  // Move keyboard focus onto the first recovery action: `role="alert"` already gets the
  // text announced, and focus would otherwise be stranded on the now-hidden button
  // behind the overlay. The first action is always interactive, so its focus ring is
  // wanted (unlike one on the heading).
  const firstActionRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    firstActionRef.current?.focus()
  }, [])

  return (
    <div className={`fk-step fk-step-error${className ? ` ${className}` : ""}`} style={style} role="alert">
      <div className="fk-error-badge">
        {resolved.image.kind === "emoji" && <span className="fk-emoji-xl">{resolved.image.value}</span>}
        {resolved.image.kind === "icon" && (
          <span
            className="fk-error-badge-icon"
            dangerouslySetInnerHTML={{ __html: sanitizeStepIcon(resolved.image.value) }}
          />
        )}
        {resolved.image.kind === "image" && (
          <img className="fk-error-badge-img" src={resolved.image.value} alt="" />
        )}
      </div>
      <h1 className="fk-title">{resolved.title}</h1>
      <p className="fk-subtitle">
        <FlowMarkdown text={resolved.message} variant="block" />
      </p>
      <div className="fk-error-actions">
        {resolved.actions.map((item, i) => (
          <button
            key={i}
            ref={i === 0 ? firstActionRef : undefined}
            type="button"
            className={i === 0 ? "fk-btn-primary" : "fk-btn-secondary"}
            onClick={() => onAction(item)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
