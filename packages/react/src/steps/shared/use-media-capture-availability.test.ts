import { afterEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useMediaCaptureAvailability } from "./use-media-capture-availability"

function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, "userAgent", { value: ua, configurable: true })
}

function stubEnumerateDevices(devices: { kind: string }[]) {
  Object.defineProperty(window.navigator, "mediaDevices", {
    value: { enumerateDevices: vi.fn().mockResolvedValue(devices) },
    configurable: true,
  })
}

describe("useMediaCaptureAvailability", () => {
  const originalUserAgent = window.navigator.userAgent
  const originalMediaDevices = window.navigator.mediaDevices

  afterEach(() => {
    Object.defineProperty(window.navigator, "userAgent", { value: originalUserAgent, configurable: true })
    Object.defineProperty(window.navigator, "mediaDevices", { value: originalMediaDevices, configurable: true })
  })

  it("hides the capture button on a desktop user agent", () => {
    setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    const { result } = renderHook(() => useMediaCaptureAvailability())
    expect(result.current.showCaptureButton).toBe(false)
  })

  it("shows the capture button on a mobile user agent with a camera", async () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15")
    stubEnumerateDevices([{ kind: "videoinput" }, { kind: "audioinput" }])
    const { result } = renderHook(() => useMediaCaptureAvailability())
    await waitFor(() => expect(result.current.showCaptureButton).toBe(true))
  })

  it("falls back to upload-only on a mobile device confirmed to have no camera", async () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15")
    stubEnumerateDevices([{ kind: "audioinput" }])
    const { result } = renderHook(() => useMediaCaptureAvailability())
    await waitFor(() => expect(result.current.showCaptureButton).toBe(false))
  })

  it("defaults to showing the button on mobile when enumerateDevices is unsupported", () => {
    setUserAgent("Mozilla/5.0 (Linux; Android 14)")
    Object.defineProperty(window.navigator, "mediaDevices", { value: undefined, configurable: true })
    const { result } = renderHook(() => useMediaCaptureAvailability())
    expect(result.current.showCaptureButton).toBe(true)
  })
})
