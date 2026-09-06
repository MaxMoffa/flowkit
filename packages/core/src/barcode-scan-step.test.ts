import { describe, expect, it } from "vitest"
import {
  DEFAULT_BARCODE_FORMATS,
  barcodeScanStepSchema,
  buildReportRows,
  getStepValidationIssue,
  parseFlow,
  resolveBarcodeFormats,
  type Answers,
  type BarcodeScanStep,
  type Flow,
} from "./index"

const scanConfig = {
  id: "scan",
  key: "scan",
  type: "barcode-scan",
  title: "Scan the product barcode",
}

function scanFlow(overrides: Record<string, unknown> = {}): Flow {
  return parseFlow({
    id: "scan-flow",
    title: "Scan",
    steps: [
      { id: "intro", type: "intro", title: "Start" },
      { ...scanConfig, ...overrides },
      { id: "review", type: "review" },
      { id: "done", type: "confirmation" },
    ],
  })
}

describe("barcode-scan schema", () => {
  it("defaults allowManualEntry to true and leaves formats unset", () => {
    const step = barcodeScanStepSchema.parse(scanConfig)
    expect(step.allowManualEntry).toBe(true)
    expect(step.formats).toBeUndefined()
  })

  it("accepts an explicit formats list", () => {
    const step = barcodeScanStepSchema.parse({ ...scanConfig, formats: ["qr_code", "ean_13"] })
    expect(step.formats).toEqual(["qr_code", "ean_13"])
  })

  it("rejects an unknown symbology", () => {
    expect(() => barcodeScanStepSchema.parse({ ...scanConfig, formats: ["not-a-format"] })).toThrow()
  })

  it("allowManualEntry can be disabled explicitly", () => {
    const step = barcodeScanStepSchema.parse({ ...scanConfig, allowManualEntry: false })
    expect(step.allowManualEntry).toBe(false)
  })
})

describe("resolveBarcodeFormats", () => {
  it("falls back to DEFAULT_BARCODE_FORMATS when unset", () => {
    const step = barcodeScanStepSchema.parse(scanConfig)
    expect(resolveBarcodeFormats(step)).toEqual(DEFAULT_BARCODE_FORMATS)
  })

  it("uses the step's own formats when set", () => {
    const step = barcodeScanStepSchema.parse({ ...scanConfig, formats: ["qr_code"] })
    expect(resolveBarcodeFormats(step)).toEqual(["qr_code"])
  })
})

describe("barcode-scan validation", () => {
  it("requires a decoded/entered code by default", () => {
    const step = scanFlow().steps.find((s) => s.id === "scan")! as BarcodeScanStep
    expect(getStepValidationIssue(step, { scan: null } as Answers)?.rule).toBe("required")
  })

  it("is skippable when required: false", () => {
    const step = scanFlow({ required: false }).steps.find((s) => s.id === "scan")!
    expect(getStepValidationIssue(step, { scan: null } as Answers)).toBeNull()
  })

  it("rejects an empty code string", () => {
    const step = scanFlow().steps.find((s) => s.id === "scan")!
    expect(getStepValidationIssue(step, { scan: { code: "" } } as Answers)?.rule).toBe("required")
  })

  it("accepts a scanned value with a format", () => {
    const step = scanFlow().steps.find((s) => s.id === "scan")!
    expect(getStepValidationIssue(step, { scan: { code: "0123456789012", format: "ean_13" } } as Answers)).toBeNull()
  })

  it("accepts a manually entered value with no format", () => {
    const step = scanFlow().steps.find((s) => s.id === "scan")!
    expect(getStepValidationIssue(step, { scan: { code: "ABC-123" } } as Answers)).toBeNull()
  })
})

describe("barcode-scan report row", () => {
  it("shows the decoded code", () => {
    const flow = scanFlow()
    const row = buildReportRows(flow, { scan: { code: "0123456789012", format: "ean_13" } }).find(
      (r) => r.stepId === "scan",
    )
    expect(row?.value).toBe("🔎 0123456789012")
  })

  it("shows an em dash with no scan", () => {
    const flow = scanFlow({ required: false })
    const row = buildReportRows(flow, { scan: null }).find((r) => r.stepId === "scan")
    expect(row?.value).toBe("—")
  })
})
