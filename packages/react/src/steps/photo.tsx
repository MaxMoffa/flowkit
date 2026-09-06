import { useEffect, useRef, useState } from "react"
import type { PhotoStep } from "@flowkit-io/core"
import { resolveMediaAccept, resolveContentText, resolveText } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { useFileUpload } from "./shared/use-file-upload"
import { useCameraStream } from "./shared/use-camera-stream"
import { MediaViewer } from "./shared/media-viewer"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"
import { useFieldValidation } from "./shared/use-field-validation"
import { FieldError } from "./shared/field-error"

/**
 * "photo" step: camera-only capture (see photo-step.ts for why it's a dedicated type
 * rather than a `media` flag). A live `getUserMedia` viewfinder is the primary path —
 * see `useCameraStream` — with a shutter button that grabs the current frame onto a
 * `<canvas>` and feeds it into the same `useFileUpload` pipeline `media`/`file` use, so
 * nothing downstream (report rows, review, MediaViewer) needs to special-case `photo`.
 *
 * When the camera is denied, absent, or unsupported, this degrades to the previous
 * `<input type="file" accept="image/*" capture="environment">` mechanism — never
 * blocks the step (see DECISIONS.md).
 */
export function PhotoStepView({ step, value, onChange, flow, answers, meta, validationAttempt }: StepComponentProps<PhotoStep>) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { items, canAddMore, addFiles, addCapturedFile, removeItem } = useFileUpload({
    value,
    onChange,
    maxItems: step.maxPhotos,
    kindOf: () => "image",
  })
  // Camera stays open across shots while there's still room for another (maxPhotos),
  // and stops the instant that's no longer true. `status` only changes again once
  // `canAddMore` flips (the hook's effect doesn't retry on its own), so a denied/
  // unavailable result sticks for the rest of this step's lifetime instead of
  // re-prompting on every render.
  const { status } = useCameraStream(videoRef, canAddMore)
  const cameraFailed = status === "denied" || status === "unavailable"
  const { message, errorId, handleBlur, ariaProps } = useFieldValidation(step, value, flow, answers, meta, validationAttempt)

  // Keep the open viewer's index in sync after a removal: clamp into range, or close
  // entirely once no items remain (same behavior as media.tsx).
  useEffect(() => {
    if (viewerIndex === null) return
    if (items.length === 0) setViewerIndex(null)
    else if (viewerIndex >= items.length) setViewerIndex(items.length - 1)
  }, [items.length, viewerIndex])

  function handleShutter() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const width = video.videoWidth || video.clientWidth
    const height = video.videoHeight || video.clientHeight
    if (!width || !height) return
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0, width, height)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: blob.type || "image/jpeg" })
        void addCapturedFile(file)
      },
      "image/jpeg",
      0.92,
    )
  }

  const accept = resolveMediaAccept({
    acceptImages: true,
    acceptVideos: false,
    imageFormats: step.imageFormats,
  })
  const captureLabel = items.length > 0 ? resolveText(flow, "photoRetake") : resolveText(flow, "photoCapture")
  const title = step.title !== undefined ? resolveContentText(flow, step.title) : undefined
  const subtitle = step.subtitle !== undefined ? resolveContentText(flow, step.subtitle) : undefined

  const statusText =
    status === "requesting"
      ? resolveText(flow, "photoRequestingPermission")
      : status === "denied"
        ? resolveText(flow, "photoPermissionDenied")
        : status === "unavailable"
          ? resolveText(flow, "photoNoCamera")
          : null

  return (
    <div className="fk-step fk-step-photo" onBlur={handleBlur} {...ariaProps}>
      <StepTitle image={step.image} title={title} />
      {subtitle && <p className="fk-subtitle"><FlowMarkdown text={subtitle} variant="block" /></p>}

      {canAddMore && !cameraFailed && (
        <>
          {/* Preview-only viewfinder — reuses barcode-scan's `.fk-barcode-viewfinder`/
              `.fk-barcode-video` look (same full-bleed live-camera box), but with no
              decode loop attached: useCameraStream just opens the stream. */}
          <div className="fk-barcode-viewfinder">
            <video ref={videoRef} className="fk-barcode-video" muted playsInline aria-label={captureLabel} />
          </div>
          {status === "streaming" && (
            <button type="button" className="fk-photo-shutter" onClick={handleShutter}>
              📷 {captureLabel}
            </button>
          )}
          <canvas ref={canvasRef} hidden />
        </>
      )}

      {canAddMore && cameraFailed && (
        <div className="fk-media-actions">
          <label className="fk-media-action-btn">
            📷 {captureLabel}
            <input
              type="file"
              accept={accept}
              capture="environment"
              hidden
              onChange={(e) => void addFiles(e.target.files)}
            />
          </label>
        </div>
      )}

      {/* Status text (requesting/denied/unavailable) stays visible even after
          degrading to the fallback input below it — same "always-reachable status,
          never silent" pattern barcode-scan.tsx uses. */}
      {canAddMore && statusText && (
        <p className="fk-barcode-status" role="status" aria-live="polite">
          {statusText}
        </p>
      )}

      {items.length > 0 && (
        <div className="fk-media-thumbs">
          {items.map((item, i) => (
            <div key={item.id} className="fk-media-thumb" onClick={() => setViewerIndex(i)}>
              <img src={item.dataUrl} alt="" />
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
