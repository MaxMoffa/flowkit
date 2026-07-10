import type { AnswerValue, GroupStep } from "@flowkit/core"
import type { StepComponentProps } from "../types"
import { getStepComponent } from "../registry"

/**
 * Step "group": renderizza i suoi step figli inline sulla stessa pagina.
 * Il valore è un oggetto aggregato { [childId]: valore }, non flat — vedi
 * group-step.ts per il perché (evita modifiche alla state machine di core).
 * Non fa parte dell'unione statica Step (evita un ciclo di tipi con
 * StepTypeMap), quindi riceve StepComponentProps<Step> e fa il cast interno.
 */
export function GroupStepView({ step, value, onChange, flow, answers }: StepComponentProps) {
  const groupStep = step as unknown as GroupStep
  const aggregate = (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Record<
    string,
    AnswerValue
  >

  return (
    <div className={`fk-step fk-step-group fk-group-${groupStep.layout}`}>
      {groupStep.title && <h2 className="fk-title">{groupStep.title}</h2>}
      {groupStep.subtitle && <p className="fk-subtitle">{groupStep.subtitle}</p>}
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
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
