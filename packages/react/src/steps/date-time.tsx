import type { DateTimeStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"

const inputTypeByMode = {
  date: "date",
  time: "time",
  datetime: "datetime-local",
} as const

function todayMin(mode: DateTimeStep["mode"]): string {
  const now = new Date()
  if (mode === "time") return now.toISOString().slice(11, 16)
  const isoDate = now.toISOString().slice(0, 10)
  return mode === "datetime" ? `${isoDate}T00:00` : isoDate
}

export function DateTimeStepView({ step, value, onChange }: StepComponentProps<DateTimeStep>) {
  const current = typeof value === "string" ? value : (step.defaultValue ?? "")
  const min = step.min ?? (step.disablePast ? todayMin(step.mode) : undefined)

  return (
    <div className="fk-step fk-step-date-time">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      <input
        className="fk-input"
        type={inputTypeByMode[step.mode]}
        value={current}
        min={min}
        max={step.max}
        step={step.step}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
