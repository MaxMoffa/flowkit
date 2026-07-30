import { useEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import type { UploadedItem } from "@flowkit-io/core"

export interface MediaViewerProps {
  items: UploadedItem[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
  onRemove: (id: string) => void
}

const SWIPE_THRESHOLD_PX = 60
const MAX_SCALE = 3

interface Point {
  x: number
  y: number
}

type GestureMode = "swipe" | "pan" | "pinch"

interface Gesture {
  mode: GestureMode
  startDistance: number
  startScale: number
  startTranslate: Point
  startX: number
  startY: number
}

function distanceOf([a, b]: Point[]): number {
  return Math.hypot(a!.x - b!.x, a!.y - b!.y)
}

/**
 * Full media viewer (v2.33): receives the whole item array + a current index, replacing
 * the single-image lightbox. Navigation (swipe/arrows/keyboard), zoom+pan (click on
 * desktop, pinch on mobile, drag-to-pan once zoomed) and delete-with-confirmation all
 * live here so the step view only owns "which index is open".
 */
export function MediaViewer({ items, index, onIndexChange, onClose, onRemove }: MediaViewerProps) {
  const item = items[index]
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 })
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const pointers = useRef(new Map<number, Point>())
  const gesture = useRef<Gesture | null>(null)

  // A new image always opens at 1x, centered.
  useEffect(() => {
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }, [index])

  function goPrev() {
    onIndexChange(Math.max(0, index - 1))
  }
  function goNext() {
    onIndexChange(Math.min(items.length - 1, index + 1))
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowLeft") goPrev()
      else if (e.key === "ArrowRight") goNext()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- goPrev/goNext close over index/items.length, re-bound every render is unnecessary; the listener reads the latest via re-registration on index/items.length change below
  }, [index, items.length, onClose])

  if (!item) return null

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    // Guarded: not implemented in every test/legacy environment.
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2) {
      gesture.current = {
        mode: "pinch",
        startDistance: distanceOf(Array.from(pointers.current.values())),
        startScale: scale,
        startTranslate: translate,
        startX: 0,
        startY: 0,
      }
    } else if (pointers.current.size === 1) {
      gesture.current = {
        mode: scale > 1 ? "pan" : "swipe",
        startDistance: 0,
        startScale: scale,
        startTranslate: translate,
        startX: e.clientX,
        startY: e.clientY,
      }
    }
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (!g) return

    if (g.mode === "pinch" && pointers.current.size === 2) {
      const nextDistance = distanceOf(Array.from(pointers.current.values()))
      const nextScale = Math.min(MAX_SCALE, Math.max(1, g.startScale * (nextDistance / g.startDistance)))
      setScale(nextScale)
    } else if (g.mode === "pan") {
      setTranslate({
        x: g.startTranslate.x + (e.clientX - g.startX),
        y: g.startTranslate.y + (e.clientY - g.startY),
      })
    }
    // "swipe" mode: the image doesn't move live; the pointerup handler below decides
    // navigation from the total horizontal delta, so a small jitter doesn't feel laggy.
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current
    pointers.current.delete(e.pointerId)

    if (g?.mode === "swipe") {
      const dx = e.clientX - g.startX
      const dy = e.clientY - g.startY
      if (Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) goNext()
        else goPrev()
      }
    }
    if (pointers.current.size === 0) gesture.current = null
  }

  function handleImageClick() {
    if (scale > 1) {
      setScale(1)
      setTranslate({ x: 0, y: 0 })
    } else {
      setScale(2)
    }
  }

  function confirmDelete() {
    setConfirmingDelete(false)
    // Non-null: this closure only ever runs while `item` is defined (the `!item` guard
    // above already returned), same as every other reference to `item` in this render.
    onRemove(item!.id)
  }

  return (
    <div className="fk-media-viewer" role="dialog" aria-modal="true">
      <div className="fk-media-viewer-topbar">
        <span className="fk-media-viewer-position">
          {index + 1} di {items.length}
        </span>
        <div className="fk-media-viewer-topbar-actions">
          <button
            type="button"
            className="fk-media-viewer-trash"
            aria-label="Elimina"
            onClick={() => setConfirmingDelete(true)}
          >
            🗑️
          </button>
          <button type="button" className="fk-media-viewer-close" aria-label="Chiudi" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      <div className="fk-media-viewer-body">
        {items.length > 1 && (
          <button
            type="button"
            className="fk-media-viewer-arrow fk-media-viewer-arrow-left"
            aria-label="Precedente"
            onClick={goPrev}
            disabled={index === 0}
          >
            ‹
          </button>
        )}

        <div
          className="fk-media-viewer-stage"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {item.kind === "video" ? (
            <video src={item.dataUrl} controls autoPlay />
          ) : (
            <img
              src={item.dataUrl}
              alt=""
              draggable={false}
              onClick={handleImageClick}
              style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})` }}
            />
          )}
        </div>

        {items.length > 1 && (
          <button
            type="button"
            className="fk-media-viewer-arrow fk-media-viewer-arrow-right"
            aria-label="Successiva"
            onClick={goNext}
            disabled={index === items.length - 1}
          >
            ›
          </button>
        )}
      </div>

      {items.length > 1 && (
        <div className="fk-media-viewer-thumbstrip">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              className={`fk-media-viewer-thumb${i === index ? " fk-media-viewer-thumb-selected" : ""}`}
              onClick={() => onIndexChange(i)}
              aria-label={`Vai a immagine ${i + 1}`}
            >
              {it.kind === "video" ? <video src={it.dataUrl} muted /> : <img src={it.dataUrl} alt="" />}
            </button>
          ))}
        </div>
      )}

      {confirmingDelete && (
        <div className="fk-media-viewer-confirm" role="alertdialog" aria-modal="true">
          <div className="fk-media-viewer-confirm-box">
            <p>Eliminare questo elemento? L&apos;azione non è reversibile.</p>
            <div className="fk-media-viewer-confirm-actions">
              <button type="button" className="fk-media-viewer-confirm-cancel" onClick={() => setConfirmingDelete(false)}>
                Annulla
              </button>
              <button type="button" className="fk-media-viewer-confirm-delete" onClick={confirmDelete}>
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
