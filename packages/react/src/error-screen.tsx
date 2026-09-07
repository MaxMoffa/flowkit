import { useEffect, useRef } from "react"
import type { ResolvedErrorAction, ResolvedErrorScreen } from "@flowkit-io/core"
import { FlowMarkdown } from "./markdown"
import { StepImage } from "./steps/shared/step-image"

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
}: {
  resolved: ResolvedErrorScreen
  onAction: (resolved: ResolvedErrorAction) => void
}) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="fk-step fk-step-error" role="alert">
      <div className="fk-error-badge">
        {resolved.image.kind === "emoji" ? (
          <span className="fk-emoji-xl">{resolved.image.value}</span>
        ) : (
          <StepImage image={resolved.image} size="badge" />
        )}
      </div>
      <h1 className="fk-title" tabIndex={-1} ref={headingRef}>
        {resolved.title}
      </h1>
      <p className="fk-subtitle">
        <FlowMarkdown text={resolved.message} variant="block" />
      </p>
      <div className="fk-error-actions">
        {resolved.actions.map((item, i) => (
          <button
            key={i}
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
