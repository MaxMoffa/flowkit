import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { Answers, CurrentStepInfo, Flow, FlowState, StepChangeDirection } from "@flowkit-io/core"
import {
  answerKey,
  applyBranch,
  canGoNext,
  computeInitialFlowState,
  createFlowState,
  filterValidAnswers,
  getCurrentStep,
  getCurrentStepInfo,
  getProgressInfo,
  getStepMeta,
  getStepTypeDefinition,
  goToStep,
  isFirstStep,
  isLastStep,
  isStepReachable,
  next as nextState,
  prev as prevState,
  resolveBranch,
  resolveText,
  setAnswerAndInvalidateDownstream,
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
  /** Called every time the visibly rendered step changes (see `CurrentStepInfo`,
   *  core/machine.ts) — mount, next/back, a review-row jump, and a branch-invalidating
   *  answer edit ("branch-change"). Never called for a "logic" (branch) step itself:
   *  those are resolved and skipped before this fires. */
  onStepChange?: (step: CurrentStepInfo) => void
  /** Step to start on instead of the first step, by id — e.g. to resume a flow after a
   *  page refresh. Read once, at mount: changing it on a later render has no effect.
   *  Falls back silently to the normal initial step if the id doesn't exist in `flow`,
   *  or isn't reachable given `initialAnswers` (e.g. a branch would route elsewhere) —
   *  never throws. */
  initialStep?: string
  /** Answers to preload before the flow ever renders — typically used together with
   *  `initialStep` to resume a flow after a page refresh. Read once, at mount. Each
   *  entry is validated against its step's own validation rule and dropped if invalid;
   *  keys that don't match any step's `key`/`id` are dropped too. Never throws. */
  initialAnswers?: Answers
}

/** Imperative handle exposed via `ref`: a `currentStep` that's always in sync with the
 *  most recent `onStepChange` call (including the initial one, already correct on first
 *  render) — lets an integrator read the current step without maintaining their own
 *  `onStepChange`-fed state. `goToStep`/`getAnswers`/`setAnswers`/`reset` let an
 *  integrator drive the flow from outside (e.g. resuming after a refresh alongside
 *  `initialStep`/`initialAnswers`, or a custom "jump to step" control). */
export interface FlowRunnerHandle {
  currentStep: CurrentStepInfo
  /** Jumps to `stepId` if it exists in the flow and is reachable given the current
   *  answers (the same rule `initialStep` uses at mount) — returns whether the jump
   *  happened. An unknown or unreachable id is a no-op that returns `false`; never
   *  throws. Reports through `onStepChange`/`currentStep` with `direction: "jump"`,
   *  same as a review-row shortcut. */
  goToStep: (stepId: string) => boolean
  /** Current answers snapshot (same shape `onChange` receives). */
  getAnswers: () => Answers
  /** Replaces the answers wholesale — same validation/unknown-key filtering as
   *  `initialAnswers`. Does not itself move the current step. */
  setAnswers: (answers: Answers) => void
  /** Resets the flow to its blank starting state — the same action the confirmation
   *  screen's restart button performs. Ignores `initialStep`/`initialAnswers` (those
   *  only ever apply at mount). */
  reset: () => void
}

export const FlowRunner = forwardRef<FlowRunnerHandle, FlowRunnerProps>(function FlowRunner(
  { flow, theme, mode, onSubmit, onChange, onStepChange, initialStep, initialAnswers },
  ref,
) {
  const [state, setState] = useState<FlowState>(() =>
    computeInitialFlowState(flow, { initialStepId: initialStep, initialAnswers }),
  )
  const [direction, setDirection] = useState<"next" | "prev">("next")
  /** Direction label for the *next* step-change event the emission effect below fires —
   *  set synchronously by whichever handler initiates a transition (handleNext/Prev/
   *  NavigateToStep/Restart/Change), read once the resulting state settles on a real
   *  (non-"logic") step. A chain of "logic" steps resolving in between doesn't touch
   *  it, so the whole chain still reports under the direction that started it. */
  const pendingDirectionRef = useRef<StepChangeDirection>("initial")
  /** Last `CurrentStepInfo` actually reported via `onStepChange`/the ref handle — `null`
   *  only before the very first emission. Doubles as the source for `previousStep`. */
  const emittedStepRef = useRef<CurrentStepInfo | null>(null)
  const [currentStep, setCurrentStep] = useState<CurrentStepInfo>(() =>
    getCurrentStepInfo(flow, state, "initial", null),
  )
  useImperativeHandle(
    ref,
    () => ({
      currentStep,
      goToStep: (stepId: string) => {
        if (!isStepReachable(flow, state, stepId)) return false
        pendingDirectionRef.current = "jump"
        setState((s) => goToStep(flow, s, stepId))
        return true
      },
      getAnswers: () => state.answers,
      setAnswers: (answers: Answers) => {
        setState((s) => ({ ...s, answers: filterValidAnswers(flow, answers) }))
      },
      reset: handleRestart,
    }),
    [currentStep, flow, state],
  )
  /** Set while the user is editing an answer they reached by clicking a review row;
   *  the next "Continua" jumps back to this index (the review step) instead of +1. */
  const [returnToIndex, setReturnToIndex] = useState<number | null>(null)
  /** Bumped each time the user tries to advance while the current step is still
   *  invalid (only reachable when the primary button isn't hard-disabled, e.g. a
   *  "group" step with requiredChildren: {mode: "any"|"none"} — see group.tsx). Reset
   *  on every step change. Forces every field's error to show (steps/shared/
   *  use-field-validation.ts) and moves focus to the first invalid field. */
  const [attempt, setAttempt] = useState(0)
  const scopeRef = useRef<HTMLDivElement>(null)
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
  const progressInfo = useMemo(() => getProgressInfo(flow, state), [flow, state])
  const pct = progressInfo.pct !== null ? Math.round(progressInfo.pct * 100) : null
  const stepRole = getStepTypeDefinition(step.type)?.role
  const isIntro = stepRole === "intro"
  const isConfirmation = stepRole === "confirmation"
  const isLogic = stepRole === "logic"
  const showHeader = !isIntro && !isConfirmation && !isLogic
  const isReviewType = stepRole === "review"
  const isFinalReviewSubmit = isReviewType && (step as StepWithReviewFields).mode !== "checkpoint"

  const layout = useFlowRunnerLayout(step, theme, mode, direction)
  const progressProps = { pct, currentIndex: progressInfo.currentIndex, total: progressInfo.total }
  const visitedStepIds = useMemo(() => new Set([...state.history, step.id]), [state.history, step.id])

  useEffect(() => {
    setAttempt(0)
  }, [step.id])

  /** After a failed advance attempt, move focus to the first field the attempt itself
   *  surfaced as invalid (see use-field-validation.ts's aria-invalid wiring) — runs
   *  after paint so the aria-invalid attributes from this render are already in the DOM. */
  useEffect(() => {
    if (attempt === 0) return
    const target = scopeRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    target?.focus()
  }, [attempt])

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

  /** A "branch" (role: "logic") step is never shown: resolve its target and jump
   *  synchronously, before the browser paints, so it never actually renders on screen
   *  (its component itself also just renders null, belt-and-suspenders). Runs on mount
   *  and on every index change; the `stepRole !== "logic"` guard makes it a no-op once
   *  the jump has landed on a real step, so it can't loop. */
  useLayoutEffect(() => {
    if (stepRole !== "logic") return
    const target = resolveBranch(flow, state)
    setState((s) => applyBranch(flow, s, target))
  }, [flow, state, stepRole])

  /** Reports the settled current step: skipped while still on a "logic" step (the
   *  branch-resolution effect above hasn't landed yet — runs first, same commit) so a
   *  branch is never itself reported, only the visible step it resolves to. Fires once
   *  per actually-changed id/index/total, so re-renders that don't move anything (or an
   *  intermediate commit mid a chained-branch resolution) are silent. `currentStep`
   *  (state, for the ref handle) and the `onStepChange` call are set together here, so
   *  the two can never observe different values. */
  useLayoutEffect(() => {
    if (stepRole === "logic") return
    const prevInfo = emittedStepRef.current
    const info = getCurrentStepInfo(flow, state, pendingDirectionRef.current, prevInfo)
    if (prevInfo && prevInfo.id === info.id && prevInfo.index === info.index && prevInfo.total === info.total) {
      return
    }
    emittedStepRef.current = info
    setCurrentStep(info)
    onStepChange?.(info)
    // onStepChange deliberately omitted: it's an integrator-supplied callback, often a
    // fresh function identity every render; depending on it would re-fire this effect
    // (and re-diff/emit) on every unrelated parent render instead of only on real step
    // changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow, state, stepRole])

  function handleChange(value: Parameters<typeof setAnswerAndInvalidateDownstream>[3]) {
    // Functional update: a step (e.g. the "smartFill" add-on) may also call
    // onMetaChange in the same event, which queues its own functional update. Using a
    // plain (non-functional) setState here would replace the whole state with one
    // computed from a stale closure, silently discarding that sibling update.
    setState((s) => {
      const result = setAnswerAndInvalidateDownstream(flow, s, step, value)
      // A branch-driving answer just made the (already-answered) downstream path
      // unreachable: the next settled-step report should say why the total/answers
      // shifted even though the visible step itself didn't change.
      if (result.invalidated) pendingDirectionRef.current = "branch-change"
      return result.state
    })
    onChange?.({ ...state.answers, [answerKey(step)]: value })
  }

  function handleMetaChange(patch: Record<string, unknown>) {
    setState((s) => setStepMeta(s, step.id, patch))
  }

  async function handleNext() {
    if (!canGoNext(flow, state)) {
      setAttempt((a) => a + 1)
      return
    }
    if (isFinalReviewSubmit) {
      await onSubmit?.(state.answers)
    }
    setDirection("next")
    if (returnToIndex !== null) {
      const target = returnToIndex
      setReturnToIndex(null)
      pendingDirectionRef.current = "jump"
      setState((s) => ({ ...s, index: target }))
      return
    }
    pendingDirectionRef.current = "next"
    setState((s) => nextState(flow, s))
  }

  function handlePrev() {
    if (flow.disableBack) return
    setDirection("prev")
    pendingDirectionRef.current = "prev"
    setState((s) => prevState(flow, s))
  }

  function handleNavigateToStep(stepId: string) {
    setReturnToIndex(state.index)
    setDirection("next")
    pendingDirectionRef.current = "jump"
    setState((s) => goToStep(flow, s, stepId))
  }

  function handleRestart() {
    pendingDirectionRef.current = "initial"
    setState(createFlowState())
  }

  /** Enter in a single-line text-like input (text/email/number/date/…) attempts to
   *  advance, same as clicking the primary button — the button itself already handles
   *  Enter/click when enabled, so this only matters while the step is invalid: it's the
   *  one real way a user can trigger `attempt` (surfacing errors + focusing the first
   *  invalid field) without the button ever needing to not be `disabled`. Deliberately
   *  scoped to `<input>` (not textarea/checkbox/radio/file/buttons), which either have
   *  their own Enter semantics or none worth intercepting. */
  function handleScopeKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Enter") return
    const target = e.target as HTMLElement
    if (target.tagName !== "INPUT") return
    const inputType = (target as HTMLInputElement).type
    if (inputType === "checkbox" || inputType === "radio" || inputType === "file" || inputType === "range") return
    e.preventDefault()
    void handleNext()
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
      ? resolveText(flow, "returnToReview")
      : isFinalReviewSubmit
        ? ((step as StepWithReviewFields).submitLabel ?? resolveText(flow, "submit"))
        : isIntro
          ? ((step as StepWithIntroFields).cta ?? resolveText(flow, "continue"))
          : resolveText(flow, "continue")

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
                  aria-label={resolveText(flow, "backAriaLabel")}
                >
                  ←
                </button>
              )}
              {layout.ProgressComponent && layout.progressPosition === "header" && (
                <layout.ProgressComponent {...progressProps} />
              )}
              {progressInfo.total !== null && (
                <span className="fk-stepno">
                  {progressInfo.currentIndex + 1}/{progressInfo.total}
                </span>
              )}
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
                ref={scopeRef}
                className={`fk-step-theme-scope${layout.animationClass}`}
                style={layout.scopeStyle}
                onKeyDown={handleScopeKeyDown}
              >
                <StepView
                  step={step}
                  value={state.answers[answerKey(step)] ?? null}
                  onChange={handleChange}
                  flow={flow}
                  answers={state.answers}
                  onNavigateToStep={isReviewType && !flow.disableBack ? handleNavigateToStep : undefined}
                  meta={getStepMeta(state, step.id)}
                  onMetaChange={handleMetaChange}
                  visitedStepIds={visitedStepIds}
                  validationAttempt={attempt}
                />
              </div>
            </div>
          </div>
        </div>
        {!last && !isLogic && (
          <StepFooter
            order={layout.footerOrder}
            showBack={showHeader && !flow.disableBack}
            backDisabled={first}
            onBack={handlePrev}
            backLabel={resolveText(flow, "back")}
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
            secondaryLabel={(step as StepWithConfirmationFields).secondaryCta ?? resolveText(flow, "confirmationRestart")}
            onSecondary={handleRestart}
            primaryLabel={(step as StepWithConfirmationFields).primaryCta ?? resolveText(flow, "confirmationHome")}
            showPrimary={(step as StepWithConfirmationFields).showHomeButton !== false}
            onPrimary={handleGoHome}
          />
        )}
      </div>
    </ThemeProvider>
  )
})
