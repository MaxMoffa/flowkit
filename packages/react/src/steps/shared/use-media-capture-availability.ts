import { useEffect, useState } from "react"

function detectMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData
  if (uaData && typeof uaData.mobile === "boolean") return uaData.mobile
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

export interface MediaCaptureAvailability {
  /** True on mobile devices with a usable camera: the view should render both the
   *  "scatta foto" (camera, `capture="environment"`) and "carica" (gallery) buttons.
   *  False on desktop, or on a mobile device confirmed to have no camera — in both
   *  cases the view falls back to a single upload button. */
  showCaptureButton: boolean
}

/**
 * Detects whether the "scatta foto" capture button should render, alongside the always-
 * present upload button: mobile-only, and only once a camera is confirmed available.
 * Camera absence is checked via `navigator.mediaDevices.enumerateDevices()` (device
 * `kind` is readable without a permission prompt in every major browser); when that API
 * is unavailable, or the check hasn't resolved yet, the default stays optimistic (button
 * shown) rather than hiding a real capability on a false negative.
 */
export function useMediaCaptureAvailability(): MediaCaptureAvailability {
  const [isMobile] = useState(detectMobileDevice)
  const [hasCamera, setHasCamera] = useState(true)

  useEffect(() => {
    if (!isMobile) return
    if (!navigator.mediaDevices?.enumerateDevices) return
    let cancelled = false
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        if (!cancelled) setHasCamera(devices.some((d) => d.kind === "videoinput"))
      })
      .catch(() => {
        // Detection failed (e.g. permission policy blocks it): keep the optimistic default.
      })
    return () => {
      cancelled = true
    }
  }, [isMobile])

  return { showCaptureButton: isMobile && hasCamera }
}
