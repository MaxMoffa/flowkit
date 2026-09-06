import { useEffect, useMemo, useRef } from "react"
import type { AnswerValue, BarcodeScanStep } from "@flowkit-io/core"
import { asBarcodeScanValue, resolveBarcodeFormats, resolveContentText, resolveText } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"
import { useFieldValidation } from "./shared/use-field-validation"
import { FieldError } from "./shared/field-error"
import { useBarcodeScanner } from "./shared/use-barcode-scanner"

/**
 * "barcode-scan" step: live camera scan of a barcode/QR code (see
 * barcode-scan-step.ts + DECISIONS.md for the full native/fallback/manual-entry
 * architecture — this component just renders `useBarcodeScanner`'s state machine and
 * the always-reachable manual entry field). A single still photo can't decode
 * anything, unlike `photo`, so this is the one step type in the pair that actually
 * needs `getUserMedia` + a live decode loop.
 *
 * Manual entry has no separate "confirm" step: typing feeds `onChange` directly, same
 * as text.tsx/notes.tsx — the flow footer's "Continua" is the only advance action (see
 * DECISIONS.md for why a camera-found result and a manually-typed one need different
 * treatment here: only a camera result carries `format`, so that's what gates the
 * "found ✅ + rescan" view — a manually typed code stays in the editable field).
 */
export function BarcodeScanStepView({ step, value, onChange, flow, answers, meta, validationAttempt }: StepComponentProps<BarcodeScanStep>) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  // Memoized on the step's own `formats` field (a stable reference once the flow is
  // parsed) so `useBarcodeScanner`'s effect doesn't see a new array every render —
  // see that hook's own comment on why that matters.
  const formats = useMemo(() => resolveBarcodeFormats(step), [step])
  const current = asBarcodeScanValue(value)
  // Only a camera-decoded result carries `format` (see barcode-scan-step.ts) — a
  // manually typed code never does. That's the sole signal this component uses to
  // tell the two apart, so the "found ✅ + rescan" view never swallows the manual
  // field the instant the user types a character into it.
  const cameraResult = current?.format !== undefined ? current : null
  const { status, result } = useBarcodeScanner(videoRef, formats, cameraResult === null)
  const { message, errorId, handleBlur, ariaProps } = useFieldValidation(step, value, flow, answers, meta, validationAttempt)

  useEffect(() => {
    if (!result) return
    // Cast: BarcodeScanValue/BarcodeScanResult has no index signature, same boundary
    // cast use-file-upload.ts performs for UploadedItem[] — AnswerValue doesn't
    // structurally include either shape.
    onChange(result as unknown as AnswerValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange is the caller's setter, re-running this on its identity would risk double-firing; `result` alone is the real trigger.
  }, [result])

  const allowManual = step.allowManualEntry !== false
  const title = step.title !== undefined ? resolveContentText(flow, step.title) : undefined
  const subtitle = step.subtitle !== undefined ? resolveContentText(flow, step.subtitle) : undefined
  // Empty when a camera result is showing (see the comment above `cameraResult`) — the
  // field visually clears itself the moment the camera wins, instead of holding onto
  // whatever partial text the user had typed before that happened.
  const manualCode = cameraResult ? "" : (current?.code ?? "")

  function handleManualChange(raw: string) {
    const trimmed = raw.trim()
    onChange((trimmed ? { code: trimmed } : null) as unknown as AnswerValue)
  }

  const statusText =
    status === "requesting"
      ? resolveText(flow, "barcodeRequestingPermission")
      : status === "scanning"
        ? resolveText(flow, "barcodeScanning")
        : status === "denied"
          ? resolveText(flow, "barcodePermissionDenied")
          : status === "unavailable"
            ? resolveText(flow, "barcodeNoCamera")
            : status === "load-error"
              ? resolveText(flow, "barcodeLoadError")
              : null

  return (
    <div className="fk-step fk-step-barcode-scan" onBlur={handleBlur} {...ariaProps}>
      <StepTitle image={step.image} title={title} />
      {subtitle && <p className="fk-subtitle"><FlowMarkdown text={subtitle} variant="block" /></p>}

      {cameraResult ? (
        <div className="fk-barcode-result">
          <div className="fk-barcode-result-icon" aria-hidden="true">✅</div>
          <div className="fk-barcode-result-code">{cameraResult.code}</div>
          {cameraResult.format && <div className="fk-barcode-result-format">{cameraResult.format}</div>}
          <button type="button" className="fk-barcode-rescan" onClick={() => onChange(null)}>
            🔄 {resolveText(flow, "barcodeRescan")}
          </button>
        </div>
      ) : (
        <>
          <div className="fk-barcode-viewfinder">
            {/* Always mounted while scanning is active — useBarcodeScanner attaches the
                stream directly to this element via a ref, it never re-renders its own
                markup based on status. Stays active (and mounted) even while the user
                types into the manual field below: a camera find still wins mid-typing. */}
            <video ref={videoRef} className="fk-barcode-video" muted playsInline aria-label={resolveText(flow, "barcodeScanning")} />
            {status === "scanning" && <div className="fk-barcode-reticle" aria-hidden="true" />}
          </div>
          {statusText && (
            <p className="fk-barcode-status" role="status" aria-live="polite">
              {statusText}
            </p>
          )}
        </>
      )}

      {allowManual && !cameraResult && (
        <div className="fk-barcode-manual">
          <label className="fk-barcode-manual-label" htmlFor={`${step.id}-barcode-manual`}>
            {resolveText(flow, "barcodeManualLabel")}
          </label>
          <input
            id={`${step.id}-barcode-manual`}
            type="text"
            inputMode="text"
            autoComplete="off"
            className="fk-input"
            placeholder={resolveText(flow, "barcodeManualPlaceholder")}
            value={manualCode}
            onChange={(e) => handleManualChange(e.target.value)}
          />
        </div>
      )}

      <FieldError id={errorId} message={message} />
    </div>
  )
}
