import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import type {
  CSSProperties,
  ForwardedRef,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react"
import { createPortal } from "react-dom"
import type { AnswerValue } from "@flowkit-io/core"
import { FlowRunner, type FlowRunnerHandle, type FlowRunnerProps } from "./flow-runner"
import { ThemeProvider } from "./theme-provider"

export type FlowOverlayPresentation = "drawer" | "dialog" | "fullscreen" | "auto"

/** Viewport width (px) at/above which `presentation="auto"` resolves to `"dialog"`
 *  (below it, `"drawer"`). Exported for consumers/tests that need the same threshold. */
export const FLOW_OVERLAY_DIALOG_BREAKPOINT = 640

/** Drag the drawer down past this fraction of its own height, or faster than
 *  {@link SWIPE_DISMISS_VELOCITY}, to dismiss it. */
const SWIPE_DISMISS_FRACTION = 0.25
/** px / ms */
const SWIPE_DISMISS_VELOCITY = 0.5

export interface FlowOverlayProps extends FlowRunnerProps {
  /** Controlled visibility. `false` fully unmounts the overlay and the inner `FlowRunner`
   *  (so the flow starts fresh on the next open — re-pass `initialStep`/`initialAnswers`
   *  to resume). While closed, a forwarded `ref` reads `null`. */
  open: boolean
  /** Called with `false` for every dismissal channel — Escape, backdrop click, the ✕
   *  button, drawer swipe-down — and, when `closeOnSubmit` is set, after the consumer's
   *  `onSubmit` promise resolves. Never called with `true`: the consumer's own trigger
   *  opens the overlay. The consumer owns the state and the unmount (by flipping `open`). */
  onOpenChange: (open: boolean) => void
  /** `"drawer"` = bottom sheet (mobile-web style, swipe-down to dismiss), `"dialog"` =
   *  centered modal, `"fullscreen"` = edge-to-edge takeover, `"auto"` = drawer below
   *  {@link FLOW_OVERLAY_DIALOG_BREAKPOINT}px viewport width, dialog at/above. Default `"auto"`. */
  presentation?: FlowOverlayPresentation
  /** When `true` (default), a backdrop click, the Escape key and a drawer swipe-down each
   *  call `onOpenChange(false)`. When `false`, only the close button (unless also hidden)
   *  and the flow's own completion can close it — for flows that must not be abandoned mid-way. */
  dismissible?: boolean
  /** Show the ✕ close button. Default `true`. Set `false` for a flow the user must not
   *  close from inside the overlay (it can still be closed via `onOpenChange`/the `ref`). */
  showCloseButton?: boolean
  /** Show the flow's name in the sheet's top-right corner (like the playground's status
   *  bar). Default `false`. Uses `ariaLabel` if given, else `flow.title`. */
  showTitle?: boolean
  /** Give the drawer/dialog a **fixed height** instead of sizing to content. `true`
   *  (default) uses `--fk-overlay-height` — a phone-portrait-ish `min(88dvh, 780px)`;
   *  a string sets the height directly (`"600px"`, `"70dvh"`, …); `false` sizes to
   *  content (capped near the viewport). Ignored for `presentation="fullscreen"`. */
  fixedHeight?: boolean | string
  /** After the consumer's `onSubmit` promise resolves, call `onOpenChange(false)`.
   *  Default `false` — the `confirmation` step stays visible inside the overlay. */
  closeOnSubmit?: boolean
  /** Portal target. Default `document.body`. */
  container?: HTMLElement
  /** Accessible name for the dialog, and the text shown when `showTitle` is set. Defaults to `flow.title`. */
  ariaLabel?: string
  /** Extra class on the sheet element. */
  className?: string
  /** Extra inline style on the sheet element. */
  style?: CSSProperties
}

/**
 * Presents a flow in a portal as a bottom **drawer** or a centered **dialog**, without a
 * dedicated page. Composes {@link FlowRunner}: every `FlowRunnerProps` field and the
 * `ref` handle (`FlowRunnerHandle`) are forwarded unchanged; this component only adds
 * visibility (`open`/`onOpenChange`) and presentation control.
 *
 * Opt-in from `@flowkit-io/react/overlay`. It registers no step components — use it
 * alongside the main entry (`import "@flowkit-io/react"`) or `/lean` +
 * `@flowkit-io/react/steps/*`, exactly like `/steps/*` composes with `/lean`.
 */
export const FlowOverlay = forwardRef<FlowRunnerHandle, FlowOverlayProps>(function FlowOverlay(
  props,
  ref,
) {
  // Defer the portal past first render: SSR renders nothing, the client renders nothing
  // on the first pass, then portals — hydration-safe, no `typeof document` dance.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!props.open || !mounted) return null

  const target = props.container ?? (typeof document !== "undefined" ? document.body : null)
  if (!target) return null

  return createPortal(<FlowOverlayContent {...props} forwardedRef={ref} />, target)
})

interface FlowOverlayContentProps extends FlowOverlayProps {
  forwardedRef: ForwardedRef<FlowRunnerHandle>
}

function FlowOverlayContent({
  onOpenChange,
  presentation = "auto",
  dismissible = true,
  showCloseButton = true,
  showTitle = false,
  fixedHeight = true,
  closeOnSubmit = false,
  ariaLabel,
  className,
  style,
  forwardedRef,
  flow,
  theme,
  mode,
  onSubmit,
  onChange,
  onStepChange,
  initialStep,
  initialAnswers,
  estimatedAddress,
  haptics,
}: FlowOverlayContentProps) {
  const resolved = usePresentation(presentation)
  const sheetRef = useRef<HTMLDivElement>(null)

  useScrollLock()
  useFocusReturn(sheetRef)
  useEscape(dismissible, onOpenChange)

  const swipe = useDrawerSwipe({
    enabled: resolved === "drawer" && dismissible,
    sheetRef,
    onDismiss: () => onOpenChange(false),
  })

  const handleSubmit = useCallback(
    async (answers: Record<string, AnswerValue>) => {
      await onSubmit?.(answers)
      if (closeOnSubmit) onOpenChange(false)
    },
    [onSubmit, closeOnSubmit, onOpenChange],
  )

  const handleTabTrap = useCallback((e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return
    const root = sheetRef.current
    if (!root) return
    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      ),
    )
    if (focusables.length === 0) {
      e.preventDefault()
      root.focus()
      return
    }
    const first = focusables[0]!
    const last = focusables[focusables.length - 1]!
    const active = document.activeElement
    if (e.shiftKey && (active === first || active === root)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }, [])

  const fixed = fixedHeight !== false && resolved !== "fullscreen"
  const sheetStyle: CSSProperties = {
    ...style,
    ...(typeof fixedHeight === "string"
      ? ({ "--fk-overlay-height": fixedHeight } as CSSProperties)
      : null),
    ...(swipe.dragY ? { transform: `translateY(${swipe.dragY}px)` } : null),
  }

  const title = ariaLabel ?? flow.title
  const closeButton = showCloseButton ? (
    <button
      type="button"
      className="fk-overlay-close"
      aria-label="Chiudi"
      onClick={() => onOpenChange(false)}
    >
      ✕
    </button>
  ) : null

  return (
    <ThemeProvider theme={theme} mode={mode}>
      <div className="fk-overlay">
        <div
          className="fk-overlay-backdrop"
          onClick={dismissible ? () => onOpenChange(false) : undefined}
        />
        <div
          ref={sheetRef}
          className={
            `fk-overlay-sheet fk-overlay-sheet--${resolved}` +
            (fixed ? " fk-overlay-sheet--fixed" : "") +
            (swipe.dragging ? " fk-overlay-sheet--dragging" : "") +
            (className ? ` ${className}` : "")
          }
          style={sheetStyle}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          onKeyDown={handleTabTrap}
        >
          {resolved === "drawer" && (
            <div className="fk-overlay-grabber" aria-hidden="true" {...swipe.grabberHandlers} />
          )}
          {showTitle ? (
            <div className="fk-overlay-header">
              {closeButton}
              <span className="fk-overlay-title">{title}</span>
            </div>
          ) : (
            closeButton
          )}
          <div className="fk-overlay-runner">
            <FlowRunner
              ref={forwardedRef}
              flow={flow}
              theme={theme}
              mode={mode}
              onSubmit={handleSubmit}
              onChange={onChange}
              onStepChange={onStepChange}
              initialStep={initialStep}
              initialAnswers={initialAnswers}
              estimatedAddress={estimatedAddress}
              haptics={haptics}
            />
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}

type ResolvedPresentation = "drawer" | "dialog" | "fullscreen"

/** Resolves `"auto"` against the viewport; passes `"drawer"`/`"dialog"`/`"fullscreen"`
 *  straight through. Falls back to `"dialog"` when `matchMedia` is unavailable (SSR, jsdom). */
function usePresentation(presentation: FlowOverlayPresentation): ResolvedPresentation {
  const query = `(min-width: ${FLOW_OVERLAY_DIALOG_BREAKPOINT}px)`
  const read = () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : true
  const [isWide, setIsWide] = useState(read)

  useEffect(() => {
    if (presentation !== "auto") return
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
    const mql = window.matchMedia(query)
    const onChange = () => setIsWide(mql.matches)
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [presentation, query])

  if (presentation !== "auto") return presentation
  return isWide ? "dialog" : "drawer"
}

/** Locks `document.body` scroll while mounted; restores the previous value on unmount.
 *  Single-overlay assumption — two overlays open at once is unsupported. */
function useScrollLock() {
  useEffect(() => {
    if (typeof document === "undefined") return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [])
}

/** Moves focus into the sheet on open, restores it to the previously focused element on close. */
function useFocusReturn(sheetRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const previouslyFocused =
      typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null
    sheetRef.current?.focus()
    return () => {
      previouslyFocused?.focus?.()
    }
  }, [sheetRef])
}

/** `window` keydown → `onOpenChange(false)` on Escape. Mirrors media-viewer.tsx. */
function useEscape(enabled: boolean, onOpenChange: (open: boolean) => void) {
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [enabled, onOpenChange])
}

interface DrawerSwipeOptions {
  enabled: boolean
  sheetRef: RefObject<HTMLDivElement | null>
  onDismiss: () => void
}

/** Drag-down-to-dismiss for the drawer, started from the grabber. Pointer-event based,
 *  same shape as steps/shared/media-viewer.tsx (`setPointerCapture` guarded for jsdom). */
function useDrawerSwipe({ enabled, sheetRef, onDismiss }: DrawerSwipeOptions) {
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef<{ y: number; t: number } | null>(null)

  useEffect(() => {
    if (enabled) return
    setDragY(0)
    setDragging(false)
    start.current = null
  }, [enabled])

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabled) return
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    start.current = { y: e.clientY, t: e.timeStamp }
    setDragging(true)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabled || !start.current) return
    setDragY(Math.max(0, e.clientY - start.current.y))
  }

  const endGesture = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabled || !start.current) return
    const deltaY = Math.max(0, e.clientY - start.current.y)
    const deltaT = Math.max(1, e.timeStamp - start.current.t)
    const velocity = deltaY / deltaT
    const sheetHeight = sheetRef.current?.getBoundingClientRect().height ?? 0
    start.current = null
    setDragging(false)
    if (deltaY > SWIPE_DISMISS_FRACTION * sheetHeight || velocity > SWIPE_DISMISS_VELOCITY) {
      onDismiss()
    } else {
      setDragY(0)
    }
  }

  return {
    dragY: enabled ? dragY : 0,
    dragging,
    grabberHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endGesture,
      onPointerCancel: endGesture,
    },
  }
}
