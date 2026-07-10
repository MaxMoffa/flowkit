import type { NotesPhotoStep } from "@flowkit/core"
import type { StepComponentProps } from "../types"

interface NotesPhotoValue {
  text?: string
  photo?: string
}

export function NotesPhotoStepView({ step, value, onChange }: StepComponentProps<NotesPhotoStep>) {
  const current: NotesPhotoValue =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as NotesPhotoValue)
      : {}

  function setText(text: string) {
    onChange({ ...current, text })
  }

  function setPhoto(file: File | null) {
    if (!file) {
      onChange({ ...current, photo: undefined })
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange({ ...current, photo: String(reader.result) })
    reader.readAsDataURL(file)
  }

  return (
    <div className="fk-step fk-step-notes-photo">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      <textarea
        className="fk-textarea"
        placeholder={step.placeholder ?? "Scrivi qui..."}
        value={current.text ?? ""}
        onChange={(e) => setText(e.target.value)}
      />
      {step.allowPhoto && (
        <label className="fk-photo-upload">
          {current.photo ? (
            <img src={current.photo} alt="" className="fk-photo-preview" />
          ) : (
            <span>📷 Aggiungi una foto</span>
          )}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
    </div>
  )
}
