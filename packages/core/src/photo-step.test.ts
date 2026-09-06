import { describe, expect, it } from "vitest"
import { buildReportRows, getStepValidationIssue, parseFlow, photoStepSchema, type Answers, type Flow, type UploadedItem } from "./index"

const photoConfig = {
  id: "shot",
  key: "shot",
  type: "photo",
  title: "Take a photo of the receipt",
}

function photoFlow(overrides: Record<string, unknown> = {}): Flow {
  return parseFlow({
    id: "camera",
    title: "Camera",
    steps: [
      { id: "intro", type: "intro", title: "Start" },
      { ...photoConfig, ...overrides },
      { id: "review", type: "review" },
      { id: "done", type: "confirmation" },
    ],
  })
}

function item(overrides: Partial<UploadedItem> = {}): UploadedItem {
  return {
    id: overrides.id ?? "1",
    name: overrides.name ?? "photo.jpg",
    mimeType: overrides.mimeType ?? "image/jpeg",
    size: overrides.size ?? 1024,
    dataUrl: overrides.dataUrl ?? "data:image/jpeg;base64,AAAA",
    kind: overrides.kind ?? "image",
  }
}

describe("photo schema", () => {
  it("defaults maxPhotos to 1", () => {
    const step = photoStepSchema.parse(photoConfig)
    expect(step.maxPhotos).toBe(1)
  })

  it("accepts an explicit maxPhotos, imageFormats and maxSizeMb", () => {
    const step = photoStepSchema.parse({
      ...photoConfig,
      maxPhotos: 3,
      imageFormats: ["image/jpeg"],
      maxSizeMb: 5,
    })
    expect(step.maxPhotos).toBe(3)
    expect(step.imageFormats).toEqual(["image/jpeg"])
    expect(step.maxSizeMb).toBe(5)
  })

  it("rejects a non-positive maxPhotos", () => {
    expect(() => photoStepSchema.parse({ ...photoConfig, maxPhotos: 0 })).toThrow()
  })
})

describe("photo validation", () => {
  it("requires at least one photo by default", () => {
    const step = photoFlow().steps.find((s) => s.id === "shot")!
    expect(getStepValidationIssue(step, { shot: null } as Answers)?.rule).toBe("required")
  })

  it("is skippable when required: false", () => {
    const step = photoFlow({ required: false }).steps.find((s) => s.id === "shot")!
    expect(getStepValidationIssue(step, { shot: null } as Answers)).toBeNull()
  })

  it("accepts a single captured photo", () => {
    const step = photoFlow().steps.find((s) => s.id === "shot")!
    expect(getStepValidationIssue(step, { shot: [item()] } as Answers)).toBeNull()
  })

  it("rejects more photos than maxPhotos", () => {
    const step = photoFlow({ maxPhotos: 1 }).steps.find((s) => s.id === "shot")!
    const issue = getStepValidationIssue(step, { shot: [item({ id: "1" }), item({ id: "2" })] } as Answers)
    expect(issue?.rule).toBe("outOfRange")
  })

  it("rejects a photo above maxSizeMb", () => {
    const step = photoFlow({ maxSizeMb: 1 }).steps.find((s) => s.id === "shot")!
    const issue = getStepValidationIssue(step, { shot: [item({ size: 2 * 1024 * 1024 })] } as Answers)
    expect(issue?.rule).toBe("fileTooLarge")
  })

  it("rejects a mime type outside imageFormats", () => {
    const step = photoFlow({ imageFormats: ["image/png"] }).steps.find((s) => s.id === "shot")!
    const issue = getStepValidationIssue(step, { shot: [item({ mimeType: "image/jpeg" })] } as Answers)
    expect(issue?.rule).toBe("invalidFileType")
  })
})

describe("photo report row", () => {
  it("counts captured photos, excluded from summary is not applicable (photo has a value)", () => {
    const flow = photoFlow()
    const answers = { shot: [item(), item({ id: "2" })] } as Answers
    const row = buildReportRows(flow, answers).find((r) => r.stepId === "shot")
    expect(row?.value).toBe("📷×2")
    expect(row?.media).toHaveLength(2)
  })

  it("shows an em dash with no photos", () => {
    const flow = photoFlow({ required: false })
    const row = buildReportRows(flow, { shot: null }).find((r) => r.stepId === "shot")
    expect(row?.value).toBe("—")
  })
})
