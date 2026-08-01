import { useEffect, useState } from "react"
import type { MediaStep } from "@flowkit-io/core"
import { resolveMediaAccept } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { useFileUpload } from "./shared/use-file-upload"
import { useMediaCaptureAvailability } from "./shared/use-media-capture-availability"
import { MediaViewer } from "./shared/media-viewer"
import { FlowMarkdown } from "../markdown"
import { useFieldValidation } from "./shared/use-field-validation"
import { FieldError } from "./shared/field-error"

export function MediaStepView({ step, value, onChange, flow, answers, meta, validationAttempt }: StepComponentProps<MediaStep>) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const { items, canAddMore, addFiles, removeItem } = useFileUpload({
    value,
    onChange,
    maxItems: step.maxItems,
    kindOf: (file) => (file.type.startsWith("video/") ? "video" : "image"),
  })
  const { showCaptureButton } = useMediaCaptureAvailability()
  const { message, errorId, handleBlur, ariaProps } = useFieldValidation(step, value, flow, answers, meta, validationAttempt)

  // Keep the open viewer's index in sync after a removal: clamp into range, or close
  // entirely once no items remain.
  useEffect(() => {
    if (viewerIndex === null) return
    if (items.length === 0) setViewerIndex(null)
    else if (viewerIndex >= items.length) setViewerIndex(items.length - 1)
  }, [items.length, viewerIndex])

  const acceptImages = step.acceptImages !== false
  const acceptVideos = step.acceptVideos === true
  const accept = resolveMediaAccept({
    acceptImages,
    acceptVideos,
    imageFormats: step.imageFormats,
    videoFormats: step.videoFormats,
  })
  const captureLabel = acceptImages && acceptVideos ? "📷 Scatta foto/video" : acceptVideos ? "🎥 Registra video" : "📷 Scatta foto"

  return (
    <div className="fk-step fk-step-media" onBlur={handleBlur} {...ariaProps}>
      {step.title && <h2 className="fk-title"><FlowMarkdown text={step.title} variant="inline" /></h2>}
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}

      {canAddMore && (
        <div className="fk-media-actions">
          {showCaptureButton && (
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
          )}
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
          {items.map((item, i) => (
            <div key={item.id} className="fk-media-thumb" onClick={() => setViewerIndex(i)}>
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

      {viewerIndex !== null && (
        <MediaViewer
          items={items}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
          onRemove={removeItem}
        />
      )}
      <FieldError id={errorId} message={message} />
    </div>
  )
}
