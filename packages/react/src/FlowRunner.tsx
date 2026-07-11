import type { CSSProperties } from "react"
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
import type { Theme, ThemeMode, ThemeTokens } from "@flowkit-io/themes"
import { notionClean, partialTokensToCssVars } from "@flowkit-io/themes"
import { getStepComponent } from "./registry"
import { getProgressComponent } from "./progress-registry"
import { BarProgress } from "./progress/BarProgress"
import { ThemeProvider } from "./ThemeProvider"
import type { FlowSubmitHandler } from "./types"

/** Step with "intro" role: optional standard fields, always present on built-in intro/confirmation, optional on custom steps with the same role. */
type StepWithIntroFields = { cta?: string }
type StepWithConfirmationFields = { secondaryCta?: string; primaryCta?: string }

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

  const resolvedTheme = theme ?? notionClean
  const resolvedTokens = mode === "dark" ? resolvedTheme.dark : resolvedTheme.light
  const stepBgUrl =
    resolvedTokens.images?.stepBackground?.[step.id] ??
    resolvedTokens.images?.stepBackground?.[step.type]
  const rootStyle: CSSProperties | undefined = stepBgUrl
    ? ({ "--fk-image-step-background": `url(${stepBgUrl})` } as CSSProperties)
    : undefined

  const themeOverride = (step as { themeOverride?: Partial<ThemeTokens> }).themeOverride
  const stepThemeVars: CSSProperties | undefined = themeOverride
    ? (partialTokensToCssVars(themeOverride) as CSSProperties)
    : undefined

  const headerOrder = resolvedTokens.layout?.headerPosition === "bottom" ? 3 : 1
  const footerOrder = resolvedTokens.layout?.footerPosition === "top" ? 0 : 4
  const progressVariant = resolvedTokens.layout?.progressVariant ?? "bar"
  const ProgressComponent =
    progressVariant === "hidden" ? null : (getProgressComponent(progressVariant) ?? BarProgress)

  const animationName = resolvedTokens.animation?.name ?? "none"
  const animationClass = animationName === "none" ? "" : ` fk-anim-${animationName} fk-anim-dir-${direction}`
  const animationVars: CSSProperties | undefined =
    animationName === "none"
      ? undefined
      : ({ "--fk-anim-duration": `${resolvedTokens.animation?.duration ?? 250}ms` } as CSSProperties)
  const scopeStyle: CSSProperties | undefined =
    stepThemeVars || animationVars ? { ...stepThemeVars, ...animationVars } : undefined

  function handleChange(value: Parameters<typeof setAnswer>[2]) {
    const nextAnswers = setAnswer(state, step.id, value)
    setState(nextAnswers)
    onChange?.(nextAnswers.answers)
  }

  async function handleNext() {
    if (step.type === "review") {
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

  const primaryLabel =
    step.type === "review"
      ? "Invia segnalazione ✓"
      : isIntro
        ? ((step as StepWithIntroFields).cta ?? "Continua")
        : "Continua"

  return (
    <ThemeProvider theme={theme} mode={mode}>
      <div className="fk-root" style={rootStyle}>
        {showHeader && (
          <div className="fk-header" style={{ order: headerOrder }}>
            <button
              type="button"
              className="fk-back"
              onClick={handlePrev}
              disabled={first}
              aria-label="Indietro"
            >
              ←
            </button>
            {ProgressComponent && (
              <ProgressComponent pct={pct} currentIndex={middleIndex} total={middleSteps.length} />
            )}
            <span className="fk-stepno">
              {middleIndex + 1}/{middleSteps.length}
            </span>
          </div>
        )}
        <div className="fk-body" style={{ order: 2 }}>
          <div className={`fk-scroll${showHeader ? "" : " fk-scroll-noheader"}`}>
            <div key={step.id} className={`fk-step-theme-scope${animationClass}`} style={scopeStyle}>
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
        {!last && (
          <div className="fk-footer" style={{ order: footerOrder }}>
            <div className="fk-footer-row">
              <button
                type="button"
                className={`fk-btn-primary ${step.type === "review" ? "fk-btn-success" : ""}`}
                disabled={!valid}
                onClick={handleNext}
              >
                {primaryLabel}
              </button>
            </div>
          </div>
        )}
        {last && isConfirmation && (
          <div className="fk-footer" style={{ order: footerOrder }}>
            <button type="button" className="fk-btn-secondary" onClick={handleRestart}>
              {(step as StepWithConfirmationFields).secondaryCta ?? "Nuova segnalazione"}
            </button>
            <button type="button" className="fk-btn-primary" onClick={handleRestart}>
              {(step as StepWithConfirmationFields).primaryCta ?? "Torna alla home"}
            </button>
          </div>
        )}
      </div>
    </ThemeProvider>
  )
}
