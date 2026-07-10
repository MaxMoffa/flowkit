import type { PhotoStep } from "@flowkit/core"
import type { StepComponentProps } from "../types"

export function PhotoStepView({ step, value, onChange }: StepComponentProps<PhotoStep>) {
  const current = typeof value === "string" ? value : ""

  function setPhoto(file: File | null) {
    if (!file) {
      onChange(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange(String(reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <div className="fk-step fk-step-photo">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      <label className="fk-photo-upload">
        {current ? (
          <img src={current} alt="" className="fk-photo-preview" />
        ) : (
          <span>📷 {step.placeholder ?? "Aggiungi una foto"}</span>
        )}
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  )
}
