import { useMemo, useState } from "react"
import type { Answers, Flow } from "@flowkit/core"
import {
  canGoNext,
  createFlowState,
  getCurrentStep,
  isFirstStep,
  isLastStep,
  next as nextState,
  prev as prevState,
  progress as flowProgress,
  setAnswer,
} from "@flowkit/core"
import type { Theme, ThemeMode } from "@flowkit/themes"
import { stepRegistry } from "./registry"
import { ThemeProvider } from "./ThemeProvider"
import type { FlowSubmitHandler } from "./types"

export interface FlowRunnerProps {
  flow: Flow
  theme?: Theme
  mode?: ThemeMode
  onSubmit?: FlowSubmitHandler
  onChange?: (answers: Answers) => void
}

export function FlowRunner({ flow, theme, mode, onSubmit, onChange }: FlowRunnerProps) {
  const [state, setState] = useState(createFlowState)
  const step = getCurrentStep(flow, state)
  const StepView = stepRegistry[step.type]
  const valid = canGoNext(flow, state)
  const first = isFirstStep(state)
  const last = isLastStep(flow, state)
  const pct = useMemo(() => Math.round(flowProgress(flow, state) * 100), [flow, state])

  const middleSteps = useMemo(
    () => flow.steps.filter((s) => s.type !== "intro" && s.type !== "confirmation"),
    [flow],
  )
  const middleIndex = middleSteps.findIndex((s) => s.id === step.id)
  const showHeader = step.type !== "intro" && step.type !== "confirmation"

  function handleChange(value: Parameters<typeof setAnswer>[2]) {
    const nextAnswers = setAnswer(state, step.id, value)
    setState(nextAnswers)
    onChange?.(nextAnswers.answers)
  }

  async function handleNext() {
    if (step.type === "review") {
      await onSubmit?.(state.answers)
    }
    setState((s) => nextState(flow, s))
  }

  function handlePrev() {
    setState((s) => prevState(flow, s))
  }

  function handleRestart() {
    setState(createFlowState())
  }

  const primaryLabel =
    step.type === "review" ? "Invia segnalazione ✓" : step.type === "intro" ? step.cta : "Continua"

  return (
    <ThemeProvider theme={theme} mode={mode}>
      <div className="fk-root">
        {showHeader && (
          <div className="fk-header">
            <button
              type="button"
              className="fk-back"
              onClick={handlePrev}
              disabled={first}
              aria-label="Indietro"
            >
              ←
            </button>
            <div className="fk-progress-track" role="progressbar" aria-valuenow={pct}>
              <div className="fk-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="fk-stepno">
              {middleIndex + 1}/{middleSteps.length}
            </span>
          </div>
        )}
        <div className="fk-body">
          <div className={showHeader ? "fk-scroll" : undefined}>
            <StepView
              step={step}
              value={state.answers[step.id] ?? null}
              onChange={handleChange}
              flow={flow}
              answers={state.answers}
            />
          </div>
        </div>
        {!last && (
          <div className="fk-footer">
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
        {last && step.type === "confirmation" && (
          <div className="fk-footer">
            <button type="button" className="fk-btn-secondary" onClick={handleRestart}>
              {step.secondaryCta ?? "Nuova segnalazione"}
            </button>
            <button type="button" className="fk-btn-primary" onClick={handleRestart}>
              {step.primaryCta ?? "Torna alla home"}
            </button>
          </div>
        )}
      </div>
    </ThemeProvider>
  )
}
