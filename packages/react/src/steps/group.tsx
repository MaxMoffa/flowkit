import type { AnswerValue, GroupStep } from "@flowkit-io/core"
import { answerKey, getStepValidationIssue, resolveValidationMessage } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { getStepComponent } from "../registry"
import { FlowMarkdown } from "../markdown"

/**
 * "group" step: renders its child steps inline on the same page. The value
 * is an aggregated object { [childId]: value }, not flat — see group-step.ts
 * for why (avoids changes to core's state machine). It isn't part of the
 * static Step union (avoids a type cycle with StepTypeMap), so it receives
 * StepComponentProps<Step> and casts internally.
 */
export function GroupStepView({
  step,
  value,
  onChange,
  flow,
  answers,
  meta,
  onMetaChange,
  validationAttempt,
}: StepComponentProps) {
  const groupStep = step as unknown as GroupStep
  const aggregate = (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Record<
    string,
    AnswerValue
  >
  const childMeta = (meta.children ?? {}) as Record<string, Record<string, unknown>>
  // "columns" only makes sense with enough content to actually split; a single child
  // falls back to "stack" regardless of the configured layout.
  const effectiveLayout = groupStep.layout === "columns" && groupStep.steps.length >= 2 ? "columns" : "stack"

  // requiredChildren (mode "all"/"any") gates on every listed child regardless of that
  // child's own `required: false` — see group-step.ts's isChildValid, which calls
  // `validate` directly without the required-bypass `isStepValid` normally applies.
  // Force `required: true` on those children here too, so both the inline per-field
  // message (via getStepValidationIssue in use-field-validation.ts) and the summary
  // below agree with what's actually gating the "Continua" button.
  const requiredChildren = groupStep.requiredChildren
  const gatingIds =
    requiredChildren && requiredChildren.mode !== "none"
      ? new Set(requiredChildren.ids ?? groupStep.steps.map((s) => s.id))
      : null
  const effectiveSteps = groupStep.steps.map((child) =>
    gatingIds?.has(child.id) && child.required === false ? { ...child, required: true } : child,
  )

  // Only meaningful once the user has actually tried to advance (see flow-runner.tsx's
  // `attempt`): a group can be navigable while some children are still invalid (e.g.
  // requiredChildren: {mode: "any"}), so this is the one place in the library where
  // "2+ invalid fields on one page" can genuinely happen.
  const invalidChildren =
    (validationAttempt ?? 0) > 0
      ? effectiveSteps
          .map((child) => ({ child, issue: getStepValidationIssue(child, aggregate, childMeta[child.id] ?? {}) }))
          .filter((entry) => entry.issue !== null)
      : []

  return (
    <div className={`fk-step fk-step-group fk-group-${effectiveLayout}`}>
      {groupStep.title && <h2 className="fk-title"><FlowMarkdown text={groupStep.title} variant="inline" /></h2>}
      {groupStep.subtitle && <p className="fk-subtitle"><FlowMarkdown text={groupStep.subtitle} variant="block" /></p>}
      {invalidChildren.length >= 2 && (
        <div className="fk-error-summary" role="alert">
          <p className="fk-error-summary-title">Controlla i campi evidenziati</p>
          <ul className="fk-error-summary-list">
            {invalidChildren.map(({ child, issue }) => (
              <li key={child.id}>
                {child.title ?? child.id}: {resolveValidationMessage(flow, child, issue!)}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="fk-group-items">
        {effectiveSteps.map((child) => {
          const ChildView = getStepComponent(child.type)
          if (!ChildView) return null
          return (
            <div key={child.id} className="fk-group-item">
              <ChildView
                step={child}
                value={aggregate[answerKey(child)] ?? null}
                onChange={(childValue) => onChange({ ...aggregate, [answerKey(child)]: childValue })}
                flow={flow}
                answers={answers}
                meta={childMeta[child.id] ?? {}}
                onMetaChange={(patch) =>
                  onMetaChange({ children: { ...childMeta, [child.id]: { ...childMeta[child.id], ...patch } } })
                }
                validationAttempt={validationAttempt}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
