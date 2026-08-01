import { describe, expect, it } from "vitest"
import {
  formatMessage,
  getStepValidationIssue,
  parseFlow,
  resolveValidationMessage,
  type Flow,
} from "./index"

describe("formatMessage", () => {
  it("substitutes placeholders from params", () => {
    expect(formatMessage("Servono almeno {min} caratteri", { min: 5 })).toBe("Servono almeno 5 caratteri")
  })

  it("leaves an unmatched placeholder as-is", () => {
    expect(formatMessage("Tra {min} e {max}", { min: 1 })).toBe("Tra 1 e {max}")
  })
})

describe("getStepValidationIssue: text", () => {
  function stepById(flow: Flow, id: string) {
    return flow.steps.find((s) => s.id === id)!
  }

  it("reports required when empty", () => {
    const flow = parseFlow({
      id: "f",
      title: "F",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "email", type: "text", variant: "email" },
        { id: "end", type: "confirmation" },
      ],
    })
    const issue = getStepValidationIssue(stepById(flow, "email"), {})
    expect(issue).toEqual({ rule: "required" })
  })

  it("reports invalidFormat for a malformed email", () => {
    const flow = parseFlow({
      id: "f",
      title: "F",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "email", type: "text", variant: "email" },
        { id: "end", type: "confirmation" },
      ],
    })
    const issue = getStepValidationIssue(stepById(flow, "email"), { email: "not-an-email" })
    expect(issue).toEqual({ rule: "invalidFormat" })
  })

  it("surfaces minLength/maxLength on an optional field even though empty would be fine", () => {
    const flow = parseFlow({
      id: "f",
      title: "F",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "bio", type: "text", required: false, minLength: 3, maxLength: 5 },
        { id: "end", type: "confirmation" },
      ],
    })
    expect(getStepValidationIssue(stepById(flow, "bio"), {})).toBeNull()
    expect(getStepValidationIssue(stepById(flow, "bio"), { bio: "ab" })).toEqual({
      rule: "minLength",
      params: { min: 3, remaining: 1 },
    })
    expect(getStepValidationIssue(stepById(flow, "bio"), { bio: "abcdef" })).toEqual({
      rule: "maxLength",
      params: { max: 5, excess: 1 },
    })
    expect(getStepValidationIssue(stepById(flow, "bio"), { bio: "abcd" })).toBeNull()
  })

  it("reports outOfRange for a number variant outside min/max", () => {
    const flow = parseFlow({
      id: "f",
      title: "F",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "age", type: "text", variant: "number", min: 18, max: 99 },
        { id: "end", type: "confirmation" },
      ],
    })
    expect(getStepValidationIssue(stepById(flow, "age"), { age: "10" })).toEqual({
      rule: "outOfRange",
      params: { min: 18, max: 99 },
    })
    expect(getStepValidationIssue(stepById(flow, "age"), { age: "25" })).toBeNull()
  })
})

describe("getStepValidationIssue: date-time", () => {
  it("reports invalidDate outside min/max", () => {
    const flow = parseFlow({
      id: "f",
      title: "F",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "d", type: "date-time", min: "2026-01-01", max: "2026-12-31" },
        { id: "end", type: "confirmation" },
      ],
    })
    const step = flow.steps.find((s) => s.id === "d")!
    expect(getStepValidationIssue(step, { d: "2027-01-01" })).toEqual({
      rule: "invalidDate",
      params: { min: "2026-01-01", max: "2026-12-31" },
    })
    expect(getStepValidationIssue(step, { d: "2026-06-01" })).toBeNull()
  })
})

describe("getStepValidationIssue: file", () => {
  function makeFlow() {
    return parseFlow({
      id: "f",
      title: "F",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "doc", type: "file", formatPreset: "pdf", maxSizeMb: 1 },
        { id: "end", type: "confirmation" },
      ],
    })
  }

  function uploadedItemAnswers(item: {
    id: string
    name: string
    mimeType: string
    size: number
    dataUrl: string
    kind: "file"
  }) {
    return { doc: [item] } as unknown as Parameters<typeof getStepValidationIssue>[1]
  }

  it("reports fileTooLarge", () => {
    const flow = makeFlow()
    const step = flow.steps.find((s) => s.id === "doc")!
    const issue = getStepValidationIssue(
      step,
      uploadedItemAnswers({ id: "1", name: "a.pdf", mimeType: "application/pdf", size: 2 * 1024 * 1024, dataUrl: "x", kind: "file" }),
    )
    expect(issue?.rule).toBe("fileTooLarge")
  })

  it("reports invalidFileType", () => {
    const flow = makeFlow()
    const step = flow.steps.find((s) => s.id === "doc")!
    const issue = getStepValidationIssue(
      step,
      uploadedItemAnswers({ id: "1", name: "a.txt", mimeType: "text/plain", size: 100, dataUrl: "x", kind: "file" }),
    )
    expect(issue?.rule).toBe("invalidFileType")
  })

  it("passes for an accepted, small enough file", () => {
    const flow = makeFlow()
    const step = flow.steps.find((s) => s.id === "doc")!
    const issue = getStepValidationIssue(
      step,
      uploadedItemAnswers({ id: "1", name: "a.pdf", mimeType: "application/pdf", size: 100, dataUrl: "x", kind: "file" }),
    )
    expect(issue).toBeNull()
  })
})

describe("getStepValidationIssue: multi-select", () => {
  it("distinguishes required (empty) from tooFewOptions (some but not enough)", () => {
    const flow = parseFlow({
      id: "f",
      title: "F",
      steps: [
        { id: "welcome", type: "intro" },
        {
          id: "topics",
          type: "multi-select",
          min: 2,
          max: 3,
          options: [
            { value: "a", label: "A" },
            { value: "b", label: "B" },
            { value: "c", label: "C" },
            { value: "d", label: "D" },
          ],
        },
        { id: "end", type: "confirmation" },
      ],
    })
    const step = flow.steps.find((s) => s.id === "topics")!
    expect(getStepValidationIssue(step, {})).toEqual({ rule: "required" })
    expect(getStepValidationIssue(step, { topics: ["a"] })).toEqual({
      rule: "tooFewOptions",
      params: { min: 2, remaining: 1 },
    })
    expect(getStepValidationIssue(step, { topics: ["a", "b", "c", "d"] })).toEqual({
      rule: "tooManyOptions",
      params: { max: 3, excess: 1 },
    })
    expect(getStepValidationIssue(step, { topics: ["a", "b"] })).toBeNull()
  })
})

describe("resolveValidationMessage", () => {
  function makeFlow(overrides: Partial<Flow> = {}): Flow {
    return parseFlow({
      id: "f",
      title: "F",
      steps: [
        { id: "welcome", type: "intro" },
        { id: "email", type: "text", variant: "email" },
        { id: "end", type: "confirmation" },
      ],
      ...overrides,
    })
  }

  it("uses the shipped Italian default when nothing is overridden", () => {
    const flow = makeFlow()
    const step = flow.steps.find((s) => s.id === "email")!
    expect(resolveValidationMessage(flow, step, { rule: "required" })).toMatch(/obbligatorio/i)
  })

  it("flow.texts overrides the shipped default", () => {
    const flow = makeFlow({ texts: { "validation.required": "Compila questo campo!" } })
    const step = flow.steps.find((s) => s.id === "email")!
    expect(resolveValidationMessage(flow, step, { rule: "required" })).toBe("Compila questo campo!")
  })

  it("a per-field validationMessages override wins over flow.texts", () => {
    const flow = parseFlow({
      id: "f",
      title: "F",
      texts: { "validation.required": "Generic default" },
      steps: [
        { id: "welcome", type: "intro" },
        {
          id: "email",
          type: "text",
          variant: "email",
          validationMessages: { required: "La tua email, per favore" },
        },
        { id: "end", type: "confirmation" },
      ],
    })
    const step = flow.steps.find((s) => s.id === "email")!
    expect(resolveValidationMessage(flow, step, { rule: "required" })).toBe("La tua email, per favore")
  })
})
