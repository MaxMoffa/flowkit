import { useState } from "react"
import type { FileStep, UploadedItem } from "@flowkit-io/core"
import { resolveFileAccept } from "@flowkit-io/core"
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

function fileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "🖼️"
  if (mimeType === "application/pdf") return "📕"
  if (mimeType.includes("word") || mimeType === "text/plain" || mimeType.includes("rtf")) return "📄"
  if (mimeType.includes("sheet") || mimeType === "text/csv" || mimeType.includes("excel")) return "📊"
  if (mimeType.includes("zip") || mimeType.includes("compressed") || mimeType.includes("rar")) return "🗜️"
  return "📎"
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileStepView({ step, value, onChange }: StepComponentProps<FileStep>) {
  const items: UploadedItem[] = Array.isArray(value) ? (value as unknown as UploadedItem[]) : []
  const [previewId, setPreviewId] = useState<string | null>(null)

  const accept = resolveFileAccept(step.formatPreset ?? "any", step.customAccept)
  const remaining = step.maxItems !== undefined ? Math.max(0, step.maxItems - items.length) : undefined
  const canAddMore = remaining === undefined || remaining > 0

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const list = remaining !== undefined ? Array.from(files).slice(0, remaining) : Array.from(files)
    const newItems = await Promise.all(
      list.map(async (file) => {
        const dataUrl = await readAsDataUrl(file)
        return {
          id: makeId(),
          name: file.name,
          mimeType: file.type,
          size: file.size,
          dataUrl,
          kind: "file" as const,
        }
      }),
    )
    onChange([...items, ...newItems] as unknown as AnswerValue)
  }

  function removeItem(id: string) {
    onChange(items.filter((i) => i.id !== id) as unknown as AnswerValue)
    if (previewId === id) setPreviewId(null)
  }

  const previewItem = items.find((i) => i.id === previewId) ?? null

  return (
    <div className="fk-step fk-step-file">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}

      {canAddMore && (
        <label className="fk-media-action-btn">
          📎 {step.placeholder ?? "Aggiungi file"}
          <input
            type="file"
            accept={accept || undefined}
            multiple={step.multiple !== false}
            hidden
            onChange={(e) => void addFiles(e.target.files)}
          />
        </label>
      )}

      {items.length > 0 && (
        <div className="fk-file-thumbs">
          {items.map((item) => (
            <div key={item.id} className="fk-file-chip" onClick={() => setPreviewId(item.id)}>
              <span className="fk-file-chip-icon">{fileIcon(item.mimeType)}</span>
              <span className="fk-file-chip-name">{item.name}</span>
              <span className="fk-file-chip-size">{formatSize(item.size)}</span>
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

      {previewItem && (
        <div className="fk-media-lightbox" role="dialog" aria-modal="true">
          <button
            type="button"
            className="fk-media-lightbox-close"
            aria-label="Chiudi"
            onClick={() => setPreviewId(null)}
          >
            ✕
          </button>
          <div className="fk-file-preview">
            <span className="fk-file-preview-icon">{fileIcon(previewItem.mimeType)}</span>
            <p className="fk-file-preview-name">{previewItem.name}</p>
            <p className="fk-file-preview-meta">
              {previewItem.mimeType || "file"} · {formatSize(previewItem.size)}
            </p>
            <a className="fk-btn-neutral" href={previewItem.dataUrl} download={previewItem.name}>
              Apri / scarica
            </a>
          </div>
          <button type="button" className="fk-media-lightbox-remove" onClick={() => removeItem(previewItem.id)}>
            Rimuovi
          </button>
        </div>
      )}
    </div>
  )
}
