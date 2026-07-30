import { useEffect, useMemo, useState } from "react"
import type { Answers, Flow } from "@flowkit-io/core"
import {
  canGoNext,
  createFlowState,
  getCurrentStep,
  getStepMeta,
  getStepTypeDefinition,
  goToStep,
  isFirstStep,
  isLastStep,
  next as nextState,
  prev as prevState,
  progress as flowProgress,
  setAnswer,
  setStepMeta,
} from "@flowkit-io/core"
import type { Theme, ThemeMode } from "@flowkit-io/themes"
import { ConfirmationFooter, StepFooter } from "./flow-footer"
import { getStepComponent } from "./registry"
import { ThemeProvider } from "./theme-provider"
import { useFlowRunnerLayout } from "./use-flow-runner-layout"
import type { FlowSubmitHandler } from "./types"

/** Step with "intro" role: optional standard fields, always present on built-in intro/confirmation, optional on custom steps with the same role. */
type StepWithIntroFields = { cta?: string }
type StepWithReviewFields = { submitLabel?: string; mode?: "final" | "checkpoint" }
type StepWithConfirmationFields = {
  secondaryCta?: string
  primaryCta?: string
  showHomeButton?: boolean
  homeUrl?: string
}

export interface FlowRunnerProps {
  flow: Flow
  theme?: Theme
  mode?: ThemeMode
  onSubmit?: FlowSubmitHandler
  onChange?: (answers: Answers) => void
}

export function FlowRunner({ flow, theme, mode, onSubmit, onChange }: FlowRunnerProps) {
  const [state, setState] = useState(createFlowState)
  const [direction, setDirection] = useState<"next" | "prev">("next")
  /** Set while the user is editing an answer they reached by clicking a review row;
   *  the next "Continua" jumps back to this index (the review step) instead of +1. */
  const [returnToIndex, setReturnToIndex] = useState<number | null>(null)
  const step = getCurrentStep(flow, state)
  const StepView = getStepComponent(step.type)
  if (!StepView) {
    throw new Error(
      `Nessun componente registrato per lo step di tipo "${step.type}". Usa registerStepComponent() prima di montare FlowRunner.`,
    )
  }
  const valid = canGoNext(flow, state)
  const first = isFirstStep(state)
  const last = isLastStep(flow, state)
  const pct = useMemo(() => Math.round(flowProgress(flow, state) * 100), [flow, state])

  const middleSteps = useMemo(
    () =>
      flow.steps.filter((s) => {
        const role = getStepTypeDefinition(s.type)?.role
        return role !== "intro" && role !== "confirmation"
      }),
    [flow],
  )
  const middleIndex = middleSteps.findIndex((s) => s.id === step.id)
  const stepRole = getStepTypeDefinition(step.type)?.role
  const isIntro = stepRole === "intro"
  const isConfirmation = stepRole === "confirmation"
  const showHeader = !isIntro && !isConfirmation
  const isReviewType = stepRole === "review"
  const isFinalReviewSubmit = isReviewType && (step as StepWithReviewFields).mode !== "checkpoint"

  const layout = useFlowRunnerLayout(step, theme, mode, direction)
  const progressProps = { pct, currentIndex: middleIndex, total: middleSteps.length }

  /** Forward-only flows must also survive the browser's own back button: push a
   *  sentinel history entry and re-push it on every popstate, so the back button
   *  never actually navigates away from the current step. */
  useEffect(() => {
    if (!flow.disableBack) return
    window.history.pushState(null, "", window.location.href)
    function handlePopState() {
      window.history.pushState(null, "", window.location.href)
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [flow.disableBack])

  function handleChange(value: Parameters<typeof setAnswer>[2]) {
    // Functional update: a step (e.g. the "smartFill" add-on) may also call
    // onMetaChange in the same event, which queues its own functional update. Using a
    // plain (non-functional) setState here would replace the whole state with one
    // computed from a stale closure, silently discarding that sibling update.
    setState((s) => setAnswer(s, step.id, value))
    onChange?.({ ...state.answers, [step.id]: value })
  }

  function handleMetaChange(patch: Record<string, unknown>) {
    setState((s) => setStepMeta(s, step.id, patch))
  }

  async function handleNext() {
    if (isFinalReviewSubmit) {
      await onSubmit?.(state.answers)
    }
    setDirection("next")
    if (returnToIndex !== null) {
      const target = returnToIndex
      setReturnToIndex(null)
      setState((s) => ({ ...s, index: target }))
      return
    }
    setState((s) => nextState(flow, s))
  }

  function handlePrev() {
    if (flow.disableBack) return
    setDirection("prev")
    setState((s) => prevState(flow, s))
  }

  function handleNavigateToStep(stepId: string) {
    setReturnToIndex(state.index)
    setDirection("next")
    setState((s) => goToStep(flow, s, stepId))
  }

  function handleRestart() {
    setState(createFlowState())
  }

  function handleGoHome() {
    const homeUrl = (step as StepWithConfirmationFields).homeUrl
    if (homeUrl) {
      window.location.href = homeUrl
      return
    }
    handleRestart()
  }

  const primaryLabel =
    returnToIndex !== null
      ? "Torna al riepilogo"
      : isFinalReviewSubmit
        ? ((step as StepWithReviewFields).submitLabel ?? "Invia segnalazione ✓")
        : isIntro
          ? ((step as StepWithIntroFields).cta ?? "Continua")
          : "Continua"

  const isMapStep = step.type === "location" || step.type === "location-leaflet"

  return (
    <ThemeProvider theme={theme} mode={mode}>
      <div className="fk-root" style={layout.rootStyle}>
        {showHeader && (
          <div className="fk-header" style={{ order: layout.headerOrder }}>
            <div className="fk-header-inner">
              {!flow.disableBack && (
                <button
                  type="button"
                  className="fk-back"
                  onClick={handlePrev}
                  disabled={first}
                  aria-label="Indietro"
                >
                  ←
                </button>
              )}
              {layout.ProgressComponent && layout.progressPosition === "header" && (
                <layout.ProgressComponent {...progressProps} />
              )}
              <span className="fk-stepno">
                {middleIndex + 1}/{middleSteps.length}
              </span>
            </div>
          </div>
        )}
        <div className="fk-body" style={{ order: 2 }}>
          <div
            className={`fk-scroll${showHeader ? "" : " fk-scroll-noheader"}${isMapStep ? " fk-scroll-location" : ""}`}
          >
            <div className="fk-scroll-inner" style={layout.scrollInnerStyle}>
              <div
                key={step.id}
                className={`fk-step-theme-scope${layout.animationClass}`}
                style={layout.scopeStyle}
              >
                <StepView
                  step={step}
                  value={state.answers[step.id] ?? null}
                  onChange={handleChange}
                  flow={flow}
                  answers={state.answers}
                  onNavigateToStep={isReviewType && !flow.disableBack ? handleNavigateToStep : undefined}
                  meta={getStepMeta(state, step.id)}
                  onMetaChange={handleMetaChange}
                />
              </div>
            </div>
          </div>
        </div>
        {!last && (
          <StepFooter
            order={layout.footerOrder}
            showBack={showHeader && !flow.disableBack}
            backDisabled={first}
            onBack={handlePrev}
            primaryLabel={primaryLabel}
            primaryDisabled={!valid}
            isSubmit={isFinalReviewSubmit}
            onPrimary={handleNext}
            progress={{
              Component: layout.ProgressComponent,
              show: layout.progressPosition === "footer",
              ...progressProps,
            }}
          />
        )}
        {last && isConfirmation && (
          <ConfirmationFooter
            order={layout.footerOrder}
            secondaryLabel={(step as StepWithConfirmationFields).secondaryCta ?? "Nuova segnalazione"}
            onSecondary={handleRestart}
            primaryLabel={(step as StepWithConfirmationFields).primaryCta ?? "Torna alla home"}
            showPrimary={(step as StepWithConfirmationFields).showHomeButton !== false}
            onPrimary={handleGoHome}
          />
        )}
      </div>
    </ThemeProvider>
  )
}
