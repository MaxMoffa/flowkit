import type { Flow, Step, StepImage } from "./schema"
import type { Answers } from "./machine"
import { answerKey } from "./machine"
import { getStepTypeDefinition } from "./registry"
import { isUploadedItemArray, type UploadedItem } from "./upload-item"

export function optionLabel(step: Step, rawValue: string): string {
  if (
    step.type === "select-cards" ||
    step.type === "chips" ||
    step.type === "multi-select" ||
    step.type === "radio"
  ) {
    return step.options.find((o) => o.value === rawValue)?.label ?? rawValue
  }
  if (step.type === "faces") {
    return (
      step.faces.find((f) => f.value === rawValue)?.label ??
      step.faces.find((f) => f.value === rawValue)?.emoji ??
      rawValue
    )
  }
  return rawValue
}

export function formatAnswer(step: Step, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"
  if (step.type === "media" || step.type === "file") {
    const items = Array.isArray(value) ? value : []
    if (items.length === 0) return "—"
    return `${step.type === "media" ? "📷" : "📎"}×${items.length}`
  }
  if (step.type === "checkbox") return value === true ? "✓ Accettato" : "—"
  if (step.type === "signature") return "✍️ Firma"
  if (Array.isArray(value)) return value.map((v) => optionLabel(step, String(v))).join(", ")
  if ((step.type as string) === "group") {
    const children = (step as unknown as { steps: Step[] }).steps
    const answers = value as Record<string, unknown>
    return (
      children
        .map((child) => formatAnswer(child, answers[answerKey(child)]))
        .filter((v) => v && v !== "—")
        .join(", ") || "—"
    )
  }
  if (typeof value === "object") return "—"
  return optionLabel(step, String(value))
}

/** Fallback emoji per step type, used when a step has no `image` of its own. */
const DEFAULT_TYPE_EMOJI: Record<string, string> = {
  location: "📍",
  "location-leaflet": "📍",
  "select-cards": "🏷️",
  scale: "📊",
  chips: "⏱️",
  radio: "🔘",
  checkbox: "☑️",
  signature: "✍️",
  faces: "🙂",
  notes: "📝",
  group: "📝",
  media: "📷",
  file: "📎",
  "date-time": "🗓️",
}

export function defaultIcon(step: Step): StepImage {
  // Cast: `image` comes from baseStepFields, which every built-in type spreads, but
  // Step (StepTypeMap[keyof StepTypeMap]) is an open union — a consumer's custom step
  // type (registered via registerStepType + module augmentation) isn't required to
  // carry it.
  const image = (step as { image?: StepImage }).image
  if (image) return image
  return { kind: "emoji", value: DEFAULT_TYPE_EMOJI[step.type as string] ?? "•" }
}

/** Recursively collects image items out of a media/file answer, including ones nested
 *  inside a group step's aggregated value, so a report row can embed them even when the
 *  step that captured them isn't a top-level step in the flow. */
function collectImages(step: Step, value: unknown): UploadedItem[] {
  if ((step.type === "media" || step.type === "file") && isUploadedItemArray(value)) {
    return value.filter((item) => item.kind === "image")
  }
  if (step.type === "signature" && typeof value === "string" && value) {
    return [{ id: step.id, name: "signature", mimeType: "image/svg+xml", size: 0, dataUrl: value, kind: "image" }]
  }
  if ((step.type as string) === "group") {
    const children = (step as unknown as { steps: Step[] }).steps
    const answers = (value as Record<string, unknown>) ?? {}
    return children.flatMap((child) => collectImages(child, answers[answerKey(child)]))
  }
  return []
}

export interface ReportRow {
  /** Id of the flow step this row was built from — lets consumers (e.g. a clickable
   *  review row) navigate back to the step that produced the answer. */
  stepId: string
  icon: StepImage
  title: string
  value: string
  /** Image items (from a media/file step, possibly nested in a group) to embed alongside the row. */
  media?: UploadedItem[]
}

/** Framework-agnostic row list for the "resoconto" report, shared by the review step,
 *  the confirmation step's print/PDF recap, and renderAnswersReportHtml.
 *
 *  `visitedStepIds`, when provided, additionally filters out steps a branch skipped
 *  over (never rendered, so they'd otherwise show up as an empty "—" row) — pass the
 *  flow's actual traversal path (FlowState.history plus the current step). Omit it
 *  to include every eligible step regardless of whether it was ever visited, the
 *  previous behavior (used by consumers with no FlowState to hand, e.g. a server-side
 *  renderAnswersReportHtml call). */
export function buildReportRows(flow: Flow, answers: Answers, visitedStepIds?: Set<string>): ReportRow[] {
  const reviewable = flow.steps.filter((s) => {
    if (visitedStepIds && !visitedStepIds.has(s.id)) return false
    const def = getStepTypeDefinition(s.type)
    const role = def?.role
    if (role === "intro" || role === "review" || role === "confirmation" || role === "logic") return false
    return def?.includeInSummary !== false
  })
  return reviewable.map((s) => {
    const value = answers[answerKey(s)]
    const media = collectImages(s, value)
    return {
      stepId: s.id,
      icon: defaultIcon(s),
      title: s.title ?? s.id,
      value: formatAnswer(s, value),
      media: media.length > 0 ? media : undefined,
    }
  })
}
