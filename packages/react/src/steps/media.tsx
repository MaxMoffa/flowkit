import { useState } from "react"
import type { MediaStep, UploadedItem } from "@flowkit-io/core"
import { resolveMediaAccept } from "@flowkit-io/core"
import type { AnswerValue } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function MediaStepView({ step, value, onChange }: StepComponentProps<MediaStep>) {
  const items: UploadedItem[] = Array.isArray(value) ? (value as unknown as UploadedItem[]) : []
  const [lightboxId, setLightboxId] = useState<string | null>(null)

  const acceptImages = step.acceptImages !== false
  const acceptVideos = step.acceptVideos === true
  const accept = resolveMediaAccept({
    acceptImages,
    acceptVideos,
    imageFormats: step.imageFormats,
    videoFormats: step.videoFormats,
  })
  const remaining = step.maxItems !== undefined ? Math.max(0, step.maxItems - items.length) : undefined
  const canAddMore = remaining === undefined || remaining > 0

  const captureLabel = acceptImages && acceptVideos ? "📷 Scatta foto/video" : acceptVideos ? "🎥 Registra video" : "📷 Scatta foto"

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const list = remaining !== undefined ? Array.from(files).slice(0, remaining) : Array.from(files)
    const newItems = await Promise.all(
      list.map(async (file) => {
        const dataUrl = await readAsDataUrl(file)
        const kind: UploadedItem["kind"] = file.type.startsWith("video/") ? "video" : "image"
        return { id: makeId(), name: file.name, mimeType: file.type, size: file.size, dataUrl, kind }
      }),
    )
    onChange([...items, ...newItems] as unknown as AnswerValue)
  }

  function removeItem(id: string) {
    onChange(items.filter((i) => i.id !== id) as unknown as AnswerValue)
    if (lightboxId === id) setLightboxId(null)
  }

  const lightboxItem = items.find((i) => i.id === lightboxId) ?? null

  return (
    <div className="fk-step fk-step-media">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}

      {canAddMore && (
        <div className="fk-media-actions">
          <label className="fk-media-action-btn">
            {captureLabel}
            <input
              type="file"
              accept={accept}
              capture="environment"
              hidden
              onChange={(e) => void addFiles(e.target.files)}
            />
          </label>
          <label className="fk-media-action-btn">
            🖼️ {step.placeholder ?? "Scegli dalla libreria"}
            <input
              type="file"
              accept={accept}
              multiple={step.multiple !== false}
              hidden
              onChange={(e) => void addFiles(e.target.files)}
            />
          </label>
        </div>
      )}

      {items.length > 0 && (
        <div className="fk-media-thumbs">
          {items.map((item) => (
            <div key={item.id} className="fk-media-thumb" onClick={() => setLightboxId(item.id)}>
              {item.kind === "video" ? (
                <video src={item.dataUrl} muted playsInline />
              ) : (
                <img src={item.dataUrl} alt="" />
              )}
              {item.kind === "video" && <span className="fk-media-play">▶</span>}
              <button
                type="button"
                className="fk-media-remove"
                aria-label="Rimuovi"
                onClick={(e) => {
                  e.stopPropagation()
                  removeItem(item.id)
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {lightboxItem && (
        <div className="fk-media-lightbox" role="dialog" aria-modal="true">
          <button
            type="button"
            className="fk-media-lightbox-close"
            aria-label="Chiudi"
            onClick={() => setLightboxId(null)}
          >
            ✕
          </button>
          {lightboxItem.kind === "video" ? (
            <video src={lightboxItem.dataUrl} controls autoPlay />
          ) : (
            <img src={lightboxItem.dataUrl} alt="" />
          )}
          <button type="button" className="fk-media-lightbox-remove" onClick={() => removeItem(lightboxItem.id)}>
            Rimuovi
          </button>
        </div>
      )}
    </div>
  )
}
