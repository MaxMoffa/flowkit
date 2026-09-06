import { useEffect, useRef, useState } from "react"
import type { RefObject } from "react"
import type { BarcodeFormat } from "@flowkit-io/core"
import { loadExternalScript } from "./external-script"

export type BarcodeScannerStatus =
  | "idle"
  | "requesting"
  | "scanning"
  | "denied"
  | "unavailable"
  | "load-error"
  | "found"

export interface BarcodeScanResult {
  code: string
  format?: BarcodeFormat | string
}

export interface BarcodeScannerState {
  status: BarcodeScannerStatus
  result: BarcodeScanResult | null
}

/** Version-pinned UMD build of @zxing/library — the fallback decoder loaded only when
 *  this step actually mounts *and* the native Barcode Detection API is unavailable
 *  (Safari/iOS chiefly). Same on-demand-script pattern as verification.tsx's Turnstile/
 *  reCAPTCHA loading (`loadExternalScript`). See DECISIONS.md for why this library/
 *  version/URL. */
export const ZXING_SCRIPT_SRC = "https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js"

/** Barcode Detection API format name -> ZXing's `BarcodeFormat` enum key. Both sides
 *  use the same lowercase snake_case names as this map's keys (barcode-scan-step.ts's
 *  `BarcodeFormat`) so a config is decoder-agnostic. */
const ZXING_FORMAT_NAMES: Record<string, string> = {
  aztec: "AZTEC",
  code_128: "CODE_128",
  code_39: "CODE_39",
  code_93: "CODE_93",
  codabar: "CODABAR",
  data_matrix: "DATA_MATRIX",
  ean_13: "EAN_13",
  ean_8: "EAN_8",
  itf: "ITF",
  pdf417: "PDF_417",
  qr_code: "QR_CODE",
  upc_a: "UPC_A",
  upc_e: "UPC_E",
}
const ZXING_FORMAT_NAMES_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(ZXING_FORMAT_NAMES).map(([k, v]) => [v, k]),
)

interface NativeDetection {
  rawValue: string
  format: string
}
interface NativeBarcodeDetector {
  detect(source: CanvasImageSource): Promise<NativeDetection[]>
}
interface NativeBarcodeDetectorCtor {
  new (options?: { formats?: string[] }): NativeBarcodeDetector
}

/** Minimal shape actually used from the ZXing UMD global — real typings aren't worth
 *  depending on for a CDN-loaded, non-npm-installed library. */
interface ZXingResult {
  getText(): string
  getBarcodeFormat(): number
}
interface ZXingReader {
  decodeFromStream(
    stream: MediaStream,
    video: HTMLVideoElement,
    callback: (result: ZXingResult | undefined, error: unknown) => void,
  ): Promise<void>
  reset(): void
}
interface ZXingGlobal {
  BrowserMultiFormatReader: new (hints?: Map<unknown, unknown>) => ZXingReader
  DecodeHintType: { POSSIBLE_FORMATS: unknown }
  BarcodeFormat: Record<string, number> & Record<number, string>
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

/**
 * Drives a live camera barcode/QR scan: `getUserMedia` for the stream, then native
 * `BarcodeDetector` when available (`"BarcodeDetector" in window` — Chrome/Edge/
 * Android, zero extra download) or a dynamically-loaded ZXing fallback otherwise
 * (Safari/iOS chiefly). See DECISIONS.md for the full architecture rationale.
 *
 * Only runs while `active` is true — the caller (barcode-scan.tsx) sets that to false
 * once a code has been captured (camera/manual) so the stream stops immediately, and
 * back to true to re-arm scanning (e.g. "scan again"). Always stops every track and
 * releases the decoder on cleanup (unmount, `active` flip, or `formats` change) —
 * never leaves a camera light on past the step that opened it.
 */
export function useBarcodeScanner(
  videoRef: RefObject<HTMLVideoElement | null>,
  formats: BarcodeFormat[],
  active: boolean,
): BarcodeScannerState {
  const [status, setStatus] = useState<BarcodeScannerStatus>("idle")
  const [result, setResult] = useState<BarcodeScanResult | null>(null)

  // Refs (not state): none of these should ever trigger a re-render on their own —
  // they're read/mutated only from inside the effect below and its cleanup.
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const readerRef = useRef<ZXingReader | null>(null)
  const stoppedRef = useRef(false)

  useEffect(() => {
    if (!active) {
      setStatus("idle")
      return
    }
    stoppedRef.current = false
    setStatus("requesting")
    setResult(null)

    function stopAll() {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      readerRef.current?.reset()
      readerRef.current = null
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
        // reach a real browser's decoder via `srcObject` regardless of play() state.
      }
    }

    function runNativeDetector(video: HTMLVideoElement, Detector: NativeBarcodeDetectorCtor) {
      const detector = new Detector({ formats })
      const loop = async () => {
        if (stoppedRef.current) return
        try {
          const detections = await detector.detect(video)
          const first = detections[0]
          if (first) {
            setResult({ code: first.rawValue, format: first.format })
            setStatus("found")
            stopAll()
            return
          }
        } catch {
          // Transient decode error on a single frame — keep looping.
        }
        rafRef.current = requestAnimationFrame(() => void loop())
      }
      rafRef.current = requestAnimationFrame(() => void loop())
    }

    async function runZXingFallback(stream: MediaStream, video: HTMLVideoElement) {
      try {
        await loadExternalScript(ZXING_SCRIPT_SRC)
      } catch {
        if (!stoppedRef.current) setStatus("load-error")
        return
      }
      if (stoppedRef.current) return
      const ZXing = (window as unknown as { ZXing?: ZXingGlobal }).ZXing
      if (!ZXing) {
        setStatus("load-error")
        return
      }
      const hints = new Map<unknown, unknown>()
      const wanted = formats.map((f) => ZXing.BarcodeFormat[ZXING_FORMAT_NAMES[f] ?? ""]).filter((f): f is number => f !== undefined)
      if (wanted.length > 0) hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, wanted)
      const reader = new ZXing.BrowserMultiFormatReader(hints)
      readerRef.current = reader
      try {
        await reader.decodeFromStream(stream, video, (res) => {
          if (stoppedRef.current || !res) return
          const formatName = ZXING_FORMAT_NAMES_REVERSE[ZXing.BarcodeFormat[res.getBarcodeFormat()] ?? ""]
          setResult({ code: res.getText(), format: formatName })
          setStatus("found")
          stopAll()
        })
      } catch {
        if (!stoppedRef.current) setStatus("load-error")
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
      setStatus("scanning")

      const NativeDetector = (window as unknown as { BarcodeDetector?: NativeBarcodeDetectorCtor }).BarcodeDetector
      if (NativeDetector) runNativeDetector(video, NativeDetector)
      else await runZXingFallback(stream, video)
    }

    void start()

    return () => {
      stoppedRef.current = true
      stopAll()
    }
  }, [active, formats, videoRef])

  return { status, result }
}
