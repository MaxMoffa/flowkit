import type { AnswerValue, GroupStep } from "@flowkit-io/core"
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
export function GroupStepView({ step, value, onChange, flow, answers, meta, onMetaChange }: StepComponentProps) {
  const groupStep = step as unknown as GroupStep
  const aggregate = (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Record<
    string,
    AnswerValue
  >
  const childMeta = (meta.children ?? {}) as Record<string, Record<string, unknown>>
  // "columns" only makes sense with enough content to actually split; a single child
  // falls back to "stack" regardless of the configured layout.
  const effectiveLayout = groupStep.layout === "columns" && groupStep.steps.length >= 2 ? "columns" : "stack"

  return (
    <div className={`fk-step fk-step-group fk-group-${effectiveLayout}`}>
      {groupStep.title && <h2 className="fk-title"><FlowMarkdown text={groupStep.title} variant="inline" /></h2>}
      {groupStep.subtitle && <p className="fk-subtitle"><FlowMarkdown text={groupStep.subtitle} variant="block" /></p>}
      <div className="fk-group-items">
        {groupStep.steps.map((child) => {
          const ChildView = getStepComponent(child.type)
          if (!ChildView) return null
          return (
            <div key={child.id} className="fk-group-item">
              <ChildView
                step={child}
                value={aggregate[child.id] ?? null}
                onChange={(childValue) => onChange({ ...aggregate, [child.id]: childValue })}
                flow={flow}
                answers={answers}
                meta={childMeta[child.id] ?? {}}
                onMetaChange={(patch) =>
                  onMetaChange({ children: { ...childMeta, [child.id]: { ...childMeta[child.id], ...patch } } })
                }
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
