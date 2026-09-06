import { useEffect, useRef, useState } from "react"
import type { RefObject } from "react"

export type CameraStreamStatus = "idle" | "requesting" | "streaming" | "denied" | "unavailable"

export interface CameraStreamState {
  status: CameraStreamStatus
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

/**
 * Opens a live, preview-only camera stream and attaches it to `videoRef` — no decode
 * loop (see use-barcode-scanner.ts for that, which this hook deliberately does NOT
 * replace: see DECISIONS.md for why the two stayed separate). Same
 * `getUserMedia({video:{facingMode:"environment"}})` call and the same
 * denied/unavailable status vocabulary `barcode-scan` already established, so callers
 * share status→i18n mapping conventions.
 *
 * Only runs while `active` is true; the caller (photo.tsx) flips that false once no
 * more shots are wanted (maxPhotos reached) or once the camera has proven
 * denied/unavailable, so it degrades to a plain file input instead of re-prompting.
 * Always stops every track and detaches `srcObject` on cleanup (unmount, `active`
 * flip, or re-run) — never leaves the camera light on past the step, same rigor as
 * signature.tsx/use-barcode-scanner.ts.
 */
export function useCameraStream(videoRef: RefObject<HTMLVideoElement | null>, active: boolean): CameraStreamState {
  const [status, setStatus] = useState<CameraStreamStatus>("idle")
  const streamRef = useRef<MediaStream | null>(null)
  const stoppedRef = useRef(false)

  useEffect(() => {
    if (!active) {
      setStatus("idle")
      return
    }
    stoppedRef.current = false
    setStatus("requesting")

    function stopAll() {
      stopStream(streamRef.current)
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
    }

    async function playVideo(video: HTMLVideoElement) {
      try {
        const p = video.play() as unknown
        if (p && typeof (p as Promise<void>).then === "function") await (p as Promise<void>).catch(() => {})
      } catch {
        // Autoplay blocked or not implemented (e.g. jsdom in tests) — frames still
        // reach a real browser's preview via `srcObject` regardless of play() state.
      }
    }

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unavailable")
        return
      }
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      } catch (err) {
        if (stoppedRef.current) return
        const name = (err as { name?: string } | undefined)?.name
        setStatus(name === "NotFoundError" || name === "OverconstrainedError" ? "unavailable" : "denied")
        return
      }
      if (stoppedRef.current) {
        stopStream(stream)
        return
      }
      streamRef.current = stream
      const video = videoRef.current
      if (!video) {
        stopStream(stream)
        return
      }
      video.srcObject = stream
      await playVideo(video)
      if (stoppedRef.current) return
      setStatus("streaming")
    }

    void start()

    return () => {
      stoppedRef.current = true
      stopAll()
    }
  }, [active, videoRef])

  return { status }
}
