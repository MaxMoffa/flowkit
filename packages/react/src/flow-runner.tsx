import { useMemo, useState } from "react"
import type { Answers, Flow } from "@flowkit-io/core"
import {
  canGoNext,
  createFlowState,
  getCurrentStep,
  getStepTypeDefinition,
  isFirstStep,
  isLastStep,
  next as nextState,
  prev as prevState,
  progress as flowProgress,
  setAnswer,
} from "@flowkit-io/core"
import type { Theme, ThemeMode } from "@flowkit-io/themes"
import { ConfirmationFooter, StepFooter } from "./flow-footer"
import { getStepComponent } from "./registry"
import { ThemeProvider } from "./theme-provider"
import { useFlowRunnerLayout } from "./use-flow-runner-layout"
import type { FlowSubmitHandler } from "./types"

/** Step with "intro" role: optional standard fields, always present on built-in intro/confirmation, optional on custom steps with the same role. */
type StepWithIntroFields = { cta?: string }
type StepWithReviewFields = { submitLabel?: string }
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
    () => flow.steps.filter((s) => !getStepTypeDefinition(s.type)?.role),
    [flow],
  )
  const middleIndex = middleSteps.findIndex((s) => s.id === step.id)
  const stepRole = getStepTypeDefinition(step.type)?.role
  const isIntro = stepRole === "intro"
  const isConfirmation = stepRole === "confirmation"
  const showHeader = !isIntro && !isConfirmation
  const isReview = step.type === "review"

  const layout = useFlowRunnerLayout(step, theme, mode, direction)
  const progressProps = { pct, currentIndex: middleIndex, total: middleSteps.length }

  function handleChange(value: Parameters<typeof setAnswer>[2]) {
    const nextAnswers = setAnswer(state, step.id, value)
    setState(nextAnswers)
    onChange?.(nextAnswers.answers)
  }

  async function handleNext() {
    if (isReview) {
      await onSubmit?.(state.answers)
    }
    setDirection("next")
    setState((s) => nextState(flow, s))
  }

  function handlePrev() {
    setDirection("prev")
    setState((s) => prevState(flow, s))
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

  const primaryLabel = isReview
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
              <button
                type="button"
                className="fk-back"
                onClick={handlePrev}
                disabled={first}
                aria-label="Indietro"
              >
                ←
              </button>
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
                />
              </div>
            </div>
          </div>
        </div>
        {!last && (
          <StepFooter
            order={layout.footerOrder}
            showBack={showHeader}
            backDisabled={first}
            onBack={handlePrev}
            primaryLabel={primaryLabel}
            primaryDisabled={!valid}
            isSubmit={isReview}
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
