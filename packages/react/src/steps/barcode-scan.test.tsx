import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { render, fireEvent, waitFor } from "@testing-library/react"
import { parseFlow, type AnswerValue, type BarcodeScanStep, type Flow } from "@flowkit-io/core"
import { BarcodeScanStepView } from "./barcode-scan"

function scanFlow(overrides: Record<string, unknown> = {}): Flow {
  return parseFlow({
    id: "scan-flow",
    title: "Scan",
    steps: [
      { id: "intro", type: "intro", title: "Start" },
      { id: "scan", key: "scan", type: "barcode-scan", title: "Scan the product barcode", ...overrides },
      { id: "review", type: "review" },
      { id: "done", type: "confirmation" },
    ],
  })
}

function StatefulScan({ flow }: { flow: Flow }) {
  const [value, setValue] = useState<AnswerValue>(null)
  const step = flow.steps.find((s) => s.type === "barcode-scan") as BarcodeScanStep
  return (
    <BarcodeScanStepView
      step={step}
      value={value}
      onChange={setValue}
      flow={flow}
      answers={value ? { scan: value } : {}}
      meta={{}}
      onMetaChange={() => {}}
    />
  )
}

function fakeStream(): MediaStream {
  return { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream
}

describe("BarcodeScanStepView", () => {
  const originalMediaDevices = window.navigator.mediaDevices
  const originalBarcodeDetector = (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector

  afterEach(() => {
    Object.defineProperty(window.navigator, "mediaDevices", { value: originalMediaDevices, configurable: true })
    ;(window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector = originalBarcodeDetector
  })

  it("falls back to the manual entry field when no camera API is available at all", async () => {
    Object.defineProperty(window.navigator, "mediaDevices", { value: undefined, configurable: true })
    const { container, getByPlaceholderText } = render(<StatefulScan flow={scanFlow()} />)

    await waitFor(() => expect(container.querySelector(".fk-barcode-status")?.textContent).toMatch(/fotocamera/i))
    expect(getByPlaceholderText("Codice")).not.toBeNull()
  })

  it("shows a denied message when getUserMedia rejects with a permission error, manual entry still works", async () => {
    const getUserMedia = vi.fn().mockRejectedValue(Object.assign(new Error("nope"), { name: "NotAllowedError" }))
    Object.defineProperty(window.navigator, "mediaDevices", { value: { getUserMedia }, configurable: true })
    const { container, getByPlaceholderText } = render(<StatefulScan flow={scanFlow()} />)

    await waitFor(() => expect(container.querySelector(".fk-barcode-status")?.textContent).toMatch(/negato/i))

    fireEvent.change(getByPlaceholderText("Codice"), { target: { value: "ABC-123" } })

    await waitFor(() => expect((getByPlaceholderText("Codice") as HTMLInputElement).value).toBe("ABC-123"))
  })

  it("decodes via the native BarcodeDetector when available, and writes the answer", async () => {
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream())
    Object.defineProperty(window.navigator, "mediaDevices", { value: { getUserMedia }, configurable: true })
    class FakeDetector {
      async detect() {
        return [{ rawValue: "0123456789012", format: "ean_13" }]
      }
    }
    ;(window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector = FakeDetector

    const { container } = render(<StatefulScan flow={scanFlow()} />)

    await waitFor(() => expect(container.querySelector(".fk-barcode-result-code")?.textContent).toBe("0123456789012"))
    expect(container.querySelector(".fk-barcode-result-format")?.textContent).toBe("ean_13")
  })

  it("lets the user scan again after a camera-found result", async () => {
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream())
    Object.defineProperty(window.navigator, "mediaDevices", { value: { getUserMedia }, configurable: true })
    class FakeDetector {
      async detect() {
        return [{ rawValue: "0123456789012", format: "ean_13" }]
      }
    }
    ;(window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector = FakeDetector

    const { container, getByText } = render(<StatefulScan flow={scanFlow()} />)
    await waitFor(() => expect(container.querySelector(".fk-barcode-result-code")).not.toBeNull())

    fireEvent.click(getByText(/Scansiona di nuovo/))
    await waitFor(() => expect(container.querySelector(".fk-barcode-viewfinder")).not.toBeNull())
    expect(container.querySelector(".fk-barcode-result-code")).toBeNull()
  })

  it("hides the manual entry field when allowManualEntry is false", async () => {
    Object.defineProperty(window.navigator, "mediaDevices", { value: undefined, configurable: true })
    const { container } = render(<StatefulScan flow={scanFlow({ allowManualEntry: false })} />)

    await waitFor(() => expect(container.querySelector(".fk-barcode-status")).not.toBeNull())
    expect(container.querySelector(".fk-barcode-manual")).toBeNull()
  })

  it("writes the answer directly as the user types, with no separate confirm button", async () => {
    const getUserMedia = vi.fn()
    Object.defineProperty(window.navigator, "mediaDevices", { value: { getUserMedia }, configurable: true })
    const { getByPlaceholderText, queryByText, container } = render(<StatefulScan flow={scanFlow()} />)

    expect(queryByText("Conferma")).toBeNull()

    fireEvent.change(getByPlaceholderText("Codice"), { target: { value: "XYZ-9" } })

    await waitFor(() => expect(container.querySelector(".fk-barcode-manual")).not.toBeNull())
    expect((getByPlaceholderText("Codice") as HTMLInputElement).value).toBe("XYZ-9")
    // No `format` on a manually typed value, so it stays in the editable field —
    // no "found ✅ + rescan" swap.
    expect(container.querySelector(".fk-barcode-result-code")).toBeNull()
  })

  it("does not hide the manual field the moment a character is typed", async () => {
    Object.defineProperty(window.navigator, "mediaDevices", { value: undefined, configurable: true })
    const { getByPlaceholderText } = render(<StatefulScan flow={scanFlow()} />)

    fireEvent.change(getByPlaceholderText("Codice"), { target: { value: "A" } })
    // Field is still present and keeps focus/typeability — querying it again must
    // still find the same input, not a "found" view replacing it.
    expect(getByPlaceholderText("Codice")).not.toBeNull()
  })

  it("clears a partially typed manual code once the camera finds a result", async () => {
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream())
    Object.defineProperty(window.navigator, "mediaDevices", { value: { getUserMedia }, configurable: true })
    class FakeDetector {
      async detect() {
        return [{ rawValue: "9998887776", format: "ean_13" }]
      }
    }
    ;(window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector = FakeDetector

    const { getByPlaceholderText, container, getByText } = render(<StatefulScan flow={scanFlow()} />)
    fireEvent.change(getByPlaceholderText("Codice"), { target: { value: "half-typed" } })

    await waitFor(() => expect(container.querySelector(".fk-barcode-result-code")?.textContent).toBe("9998887776"))

    fireEvent.click(getByText(/Scansiona di nuovo/))
    await waitFor(() => expect(container.querySelector(".fk-barcode-manual")).not.toBeNull())
    expect((getByPlaceholderText("Codice") as HTMLInputElement).value).toBe("")
  })
})
