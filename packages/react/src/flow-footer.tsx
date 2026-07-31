import type { ComponentType } from "react"
import type { ProgressComponentProps } from "./progress-registry"
import { FlowMarkdown } from "./markdown"

interface FooterShellProps {
  order: number
  children: React.ReactNode
}

function FooterShell({ order, children }: FooterShellProps) {
  return (
    <div className="fk-footer" style={{ order }}>
      <div className="fk-footer-inner">{children}</div>
    </div>
  )
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
  progress,
}: StepFooterProps) {
  const { Component: ProgressComponent, show, ...progressProps } = progress
  return (
    <FooterShell order={order}>
      {ProgressComponent && show && (
        <div className="fk-footer-progress">
          <ProgressComponent {...progressProps} />
        </div>
      )}
      <div className="fk-footer-row">
        {showBack && (
          <button type="button" className="fk-footer-back" onClick={onBack} disabled={backDisabled}>
            ← {backLabel}
          </button>
        )}
        <button
          type="button"
          className={`fk-btn-primary ${isSubmit ? "fk-btn-success" : ""}`}
          disabled={primaryDisabled}
          onClick={onPrimary}
        >
          <FlowMarkdown text={primaryLabel} variant="inline" />
        </button>
      </div>
    </FooterShell>
  )
}

interface ConfirmationFooterProps {
  order: number
  secondaryLabel: string
  onSecondary: () => void
  primaryLabel: string
  showPrimary: boolean
  onPrimary: () => void
}

/** Footer of the confirmation step: restart and go-home, no progress, no back. */
export function ConfirmationFooter({
  order,
  secondaryLabel,
  onSecondary,
  primaryLabel,
  showPrimary,
  onPrimary,
}: ConfirmationFooterProps) {
  return (
    <FooterShell order={order}>
      <div className="fk-footer-row">
        <button type="button" className="fk-btn-secondary" onClick={onSecondary}>
          <FlowMarkdown text={secondaryLabel} variant="inline" />
        </button>
        {showPrimary && (
          <button type="button" className="fk-btn-primary" onClick={onPrimary}>
            <FlowMarkdown text={primaryLabel} variant="inline" />
          </button>
        )}
      </div>
    </FooterShell>
  )
}
