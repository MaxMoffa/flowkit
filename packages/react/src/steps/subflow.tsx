import type { AnswerValue, SubflowStep, SubflowNavState } from "@flowkit-io/core"
import {
  answerKey,
  getSubflowProgress,
  getStepTypeDefinition,
  initialSubflowNav,
  isSubflowDone,
  resolveContentText,
  resolveSubflowIndex,
  resolveText,
  subflowNext,
  subflowPrev,
} from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { getStepComponent } from "../registry"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"

/**
 * "subflow" step: unlike `group` (which fuses every child onto one page), a subflow
 * renders exactly one child at a time, with its own internal next/prev navigation and
 * progress — a fully self-contained mini flow nested inside a single page of the outer
 * one. Answers still aggregate under the subflow's own id as `{ [childId]: value }`
 * (same nested pattern `group` uses); the internal nav position lives in `meta.nav`
 * (see core's `SubflowNavState`), not in the answer value.
 */
export function SubflowStepView({
  step,
  value,
  onChange,
  flow,
  answers,
  meta,
  onMetaChange,
  validationAttempt,
}: StepComponentProps) {
  const subflowStep = step as unknown as SubflowStep
  const aggregate = (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Record<
    string,
    AnswerValue
  >
  const nav = (meta.nav as SubflowNavState | undefined) ?? initialSubflowNav
  const childMeta = (meta.children ?? {}) as Record<string, Record<string, unknown>>

  const done = isSubflowDone(subflowStep, nav, answers)
  const currentIndex = resolveSubflowIndex(subflowStep, nav, answers)
  const current = subflowStep.steps[currentIndex]
  const progress = getSubflowProgress(subflowStep, nav, answers)

  const subflowTitle = subflowStep.title !== undefined ? resolveContentText(flow, subflowStep.title) : undefined
  const subflowSubtitle =
    subflowStep.subtitle !== undefined ? resolveContentText(flow, subflowStep.subtitle) : undefined

  function goNext() {
    onMetaChange({ nav: subflowNext(subflowStep, nav, answers, aggregate) })
  }
  function goPrev() {
    onMetaChange({ nav: subflowPrev(nav) })
  }

  if (done || !current) {
    // Every child has been navigated past — nothing left to show internally. The outer
    // flow's own "Continua" is what advances past the subflow itself (gated on this
    // step's registered `validate`, same as any other step); this state just avoids
    // rendering a blank card while the visitor decides whether to go back and review.
    return (
      <div className="fk-step fk-step-subflow">
        <StepTitle image={subflowStep.image} title={subflowTitle} />
        {subflowSubtitle && (
          <p className="fk-subtitle">
            <FlowMarkdown text={subflowSubtitle} variant="block" />
          </p>
        )}
        {nav.history.length > 0 && (
          <button type="button" className="fk-subflow-nav-btn fk-subflow-nav-btn-secondary" onClick={goPrev}>
            {resolveText(flow, "back")}
          </button>
        )}
      </div>
    )
  }

  const ChildView = getStepComponent(current.type)
  const canAdvance = (() => {
    const def = getStepTypeDefinition(current.type)
    return def ? def.validate(current, aggregate[answerKey(current)], aggregate) : false
  })()

  return (
    <div className="fk-step fk-step-subflow">
      <StepTitle image={subflowStep.image} title={subflowTitle} />
      {subflowSubtitle && (
        <p className="fk-subtitle">
          <FlowMarkdown text={subflowSubtitle} variant="block" />
        </p>
      )}
      {progress.total !== null && (
        <div className="fk-subflow-progress">
          <div className="fk-progress-track">
            <div
              className="fk-progress-fill"
              style={{ width: `${((progress.currentIndex + 1) / progress.total) * 100}%` }}
            />
          </div>
          <span className="fk-subflow-progress-count">
            {progress.currentIndex + 1}/{progress.total}
          </span>
        </div>
      )}
      {ChildView && (
        <div className="fk-subflow-child" key={current.id}>
          <ChildView
            step={current}
            value={aggregate[answerKey(current)] ?? null}
            onChange={(childValue) => onChange({ ...aggregate, [answerKey(current)]: childValue })}
            flow={flow}
            answers={answers}
            meta={childMeta[current.id] ?? {}}
            onMetaChange={(patch) =>
              onMetaChange({ children: { ...childMeta, [current.id]: { ...childMeta[current.id], ...patch } } })
            }
            validationAttempt={validationAttempt}
          />
        </div>
      )}
      <div className="fk-subflow-nav">
        {nav.history.length > 0 && (
          <button type="button" className="fk-subflow-nav-btn fk-subflow-nav-btn-secondary" onClick={goPrev}>
            {resolveText(flow, "back")}
          </button>
        )}
        <button
          type="button"
          className="fk-subflow-nav-btn fk-subflow-nav-btn-primary"
          onClick={goNext}
          disabled={!canAdvance}
        >
          {resolveText(flow, "continue")}
        </button>
      </div>
    </div>
  )
}
