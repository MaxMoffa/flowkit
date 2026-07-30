import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import type { SignatureStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"

/** Draws `dataUrl` (or fills with `backgroundColor` if null) into the canvas at its current CSS pixel size. */
function paintCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  backgroundColor: string,
  dataUrl: string | null,
) {
  const cssWidth = canvas.clientWidth
  const cssHeight = canvas.clientHeight
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, cssWidth, cssHeight)
  if (!dataUrl) return
  const img = new Image()
  img.onload = () => {
    ctx.drawImage(img, 0, 0, cssWidth, cssHeight)
  }
  img.src = dataUrl
}

export function SignatureStepView({ step, value, onChange }: StepComponentProps<SignatureStep>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const isDrawingRef = useRef(false)
  const undoStackRef = useRef<ImageData[]>([])
  const [fullscreen, setFullscreen] = useState(false)

  const currentValue = typeof value === "string" ? value : null
  const backgroundColor = step.backgroundColor
  const penColor = step.penColor

  function getContext(): CanvasRenderingContext2D | null {
    return canvasRef.current?.getContext("2d") ?? null
  }

  // Resizes the canvas backing store to match its current CSS size (device-pixel-ratio
  // aware), redrawing the existing signature scaled into the new dimensions. Needed on
  // mount and whenever the fullscreen toggle changes the rendered size — canvas backing
  // store size has no CSS-only equivalent, unlike the pure layout decisions elsewhere.
  function resizeToContainer() {
    const canvas = canvasRef.current
    const ctx = getContext()
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    const cssWidth = canvas.clientWidth
    const cssHeight = canvas.clientHeight
    if (cssWidth === 0 || cssHeight === 0) return

    const priorDataUrl = currentValue
    canvas.width = cssWidth * dpr
    canvas.height = cssHeight * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.lineWidth = 2.5
    ctx.strokeStyle = penColor
    paintCanvas(canvas, ctx, backgroundColor, priorDataUrl)
    undoStackRef.current = []
  }

  useEffect(() => {
    resizeToContainer()
    if (!wrapperRef.current) return
    const observer = new ResizeObserver(() => resizeToContainer())
    observer.observe(wrapperRef.current)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen])

  function handlePointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const ctx = getContext()
    if (!canvas || !ctx) return
    canvas.setPointerCapture(e.pointerId)
    undoStackRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    isDrawingRef.current = true
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return
    const canvas = canvasRef.current
    const ctx = getContext()
    if (!canvas || !ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  function endStroke() {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    onChange(canvas.toDataURL("image/png"))
  }

  function handleUndo() {
    const canvas = canvasRef.current
    const ctx = getContext()
    if (!canvas || !ctx) return
    const snapshot = undoStackRef.current.pop()
    if (!snapshot) return
    ctx.putImageData(snapshot, 0, 0)
    onChange(undoStackRef.current.length === 0 ? null : canvas.toDataURL("image/png"))
  }

  function handleClear() {
    const canvas = canvasRef.current
    const ctx = getContext()
    if (!canvas || !ctx) return
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    undoStackRef.current = []
    onChange(null)
  }

  const canUndo = undoStackRef.current.length > 0

  const canvasEl = (
    <canvas
      ref={canvasRef}
      className="fk-signature-canvas"
      style={{ height: fullscreen ? undefined : step.padHeight }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endStroke}
      onPointerCancel={endStroke}
    />
  )

  const toolbar = (step.showClear || step.showUndo) && (
    <div className="fk-signature-toolbar">
      {step.showUndo && (
        <button type="button" className="fk-btn-neutral" onClick={handleUndo} disabled={!canUndo}>
          ↩︎ Annulla
        </button>
      )}
      {step.showClear && (
        <button type="button" className="fk-btn-neutral" onClick={handleClear} disabled={!currentValue}>
          🗑️ Cancella
        </button>
      )}
      <button
        type="button"
        className="fk-btn-neutral"
        onClick={() => setFullscreen((v) => !v)}
        aria-label={fullscreen ? "Esci da schermo intero" : "Schermo intero"}
      >
        {fullscreen ? "⤡ Esci" : "⤢ Schermo intero"}
      </button>
    </div>
  )

  return (
    <div className={`fk-step fk-step-signature${fullscreen ? " fk-step-signature--full" : ""}`}>
      {fullscreen && (
        <button type="button" className="fk-back fk-signature-close" aria-label="Chiudi" onClick={() => setFullscreen(false)}>
          ✕
        </button>
      )}
      {!fullscreen && step.title && <h2 className="fk-title"><FlowMarkdown text={step.title} variant="inline" /></h2>}
      {!fullscreen && step.subtitle && (
        <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>
      )}
      <div ref={wrapperRef} className="fk-signature-pad">
        {canvasEl}
      </div>
      {toolbar}
    </div>
  )
}
