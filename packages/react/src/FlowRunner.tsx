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

  return (
    <ThemeProvider theme={theme} mode={mode}>
      <div className="fk-root">
        {!last && (
          <div className="fk-progress-track" role="progressbar" aria-valuenow={pct}>
            <div className="fk-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        )}
        <div className="fk-body">
          <StepView step={step} value={state.answers[step.id] ?? null} onChange={handleChange} flow={flow} answers={state.answers} />
        </div>
        {!last && (
          <div className="fk-footer">
            {!first && (
              <button type="button" className="fk-btn-secondary" onClick={handlePrev}>
                Indietro
              </button>
            )}
            <button
              type="button"
              className="fk-btn-primary"
              disabled={!valid}
              onClick={handleNext}
            >
              {step.type === "review" ? "Invia" : "Avanti"}
            </button>
          </div>
        )}
      </div>
    </ThemeProvider>
  )
}
