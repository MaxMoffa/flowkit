import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import type { SignatureStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"

interface Point {
  x: number
  y: number
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")
}

/** Serializes completed strokes (each an ordered list of points, in the canvas's CSS
 *  pixel space) into a standalone SVG document — a real vector signature, not a raster
 *  screenshot, so it stays crisp at any size the review/print/PDF surfaces render it. */
function buildSignatureSvg(strokes: Point[][], width: number, height: number, penColor: string, backgroundColor: string): string {
  const paths = strokes
    .filter((stroke) => stroke.length > 0)
    .map((stroke) => {
      const d = stroke.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")
      return `<path d="${d}" fill="none" stroke="${escapeAttr(penColor)}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
    })
    .join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${escapeAttr(backgroundColor)}"/>${paths}</svg>`
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svg)))}`
}

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
  /** Completed strokes, in the canvas's CSS pixel space — the source of truth the SVG is
   *  rebuilt from after every stroke, undo, and clear. */
  const strokesRef = useRef<Point[][]>([])
  const currentStrokeRef = useRef<Point[]>([])
  const [fullscreen, setFullscreen] = useState(false)

  const currentValue = typeof value === "string" ? value : null
  const backgroundColor = step.backgroundColor
  const penColor = step.penColor

  function getContext(): CanvasRenderingContext2D | null {
    return canvasRef.current?.getContext("2d") ?? null
  }

  function emitSvg(canvas: HTMLCanvasElement) {
    if (strokesRef.current.length === 0) {
      onChange(null)
      return
    }
    const svg = buildSignatureSvg(strokesRef.current, canvas.clientWidth, canvas.clientHeight, penColor, backgroundColor)
    onChange(svgToDataUrl(svg))
  }

  function redrawStrokes(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    for (const stroke of strokesRef.current) {
      ctx.beginPath()
      stroke.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
      ctx.stroke()
    }
  }

  // Resizes the canvas backing store to match its current CSS size (device-pixel-ratio
  // aware), redrawing the existing signature scaled into the new dimensions. Needed on
  // mount and whenever the fullscreen toggle changes the rendered size — canvas backing
  // store size has no CSS-only equivalent, unlike the pure layout decisions elsewhere.
  // Recorded strokes are in CSS-pixel space of the pre-resize canvas, so they're dropped
  // here (same as the undo stack) rather than redrawn at the wrong scale; the persisted
  // SVG value itself is untouched and still renders correctly via paintCanvas below.
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
    strokesRef.current = []
    currentStrokeRef.current = []
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
    isDrawingRef.current = true
    const rect = canvas.getBoundingClientRect()
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    currentStrokeRef.current = [point]
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return
    const canvas = canvasRef.current
    const ctx = getContext()
    if (!canvas || !ctx) return
    const rect = canvas.getBoundingClientRect()
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    currentStrokeRef.current.push(point)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }

  function endStroke() {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    if (currentStrokeRef.current.length > 1) {
      strokesRef.current.push(currentStrokeRef.current)
    }
    currentStrokeRef.current = []
    emitSvg(canvas)
  }

  function handleUndo() {
    const canvas = canvasRef.current
    const ctx = getContext()
    if (!canvas || !ctx || strokesRef.current.length === 0) return
    strokesRef.current.pop()
    redrawStrokes(canvas, ctx)
    emitSvg(canvas)
  }

  function handleClear() {
    const canvas = canvasRef.current
    const ctx = getContext()
    if (!canvas || !ctx) return
    strokesRef.current = []
    currentStrokeRef.current = []
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    onChange(null)
  }

  const canUndo = strokesRef.current.length > 0

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
      {!fullscreen && <StepTitle image={step.image} title={step.title} />}
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
