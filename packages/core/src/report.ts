import type { Flow, Step } from "./schema"
import type { Answers } from "./machine"
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
  if (Array.isArray(value)) return value.map((v) => optionLabel(step, String(v))).join(", ")
  if ((step.type as string) === "group") {
    const children = (step as unknown as { steps: Step[] }).steps
    const answers = value as Record<string, unknown>
    return (
      children
        .map((child) => formatAnswer(child, answers[child.id]))
        .filter((v) => v && v !== "—")
        .join(", ") || "—"
    )
  }
  if (typeof value === "object") return "—"
  return optionLabel(step, String(value))
}

export function defaultIcon(step: Step): string {
  if (step.icon) return step.icon
  switch (step.type as string) {
    case "location":
    case "location-leaflet":
      return "📍"
    case "select-cards":
      return "🏷️"
    case "scale":
      return "📊"
    case "chips":
      return "⏱️"
    case "radio":
      return "🔘"
    case "faces":
      return "🙂"
    case "notes":
    case "group":
      return "📝"
    case "media":
      return "📷"
    case "file":
      return "📎"
    case "date-time":
      return "🗓️"
    default:
      return "•"
  }
}

/** Recursively collects image items out of a media/file answer, including ones nested
 *  inside a group step's aggregated value, so a report row can embed them even when the
 *  step that captured them isn't a top-level step in the flow. */
function collectImages(step: Step, value: unknown): UploadedItem[] {
  if ((step.type === "media" || step.type === "file") && isUploadedItemArray(value)) {
    return value.filter((item) => item.kind === "image")
  }
  if ((step.type as string) === "group") {
    const children = (step as unknown as { steps: Step[] }).steps
    const answers = (value as Record<string, unknown>) ?? {}
    return children.flatMap((child) => collectImages(child, answers[child.id]))
  }
  return []
}

export interface ReportRow {
  icon: string
  title: string
  value: string
  /** Image items (from a media/file step, possibly nested in a group) to embed alongside the row. */
  media?: UploadedItem[]
}

/** Framework-agnostic row list for the "resoconto" report, shared by the review step,
 *  the confirmation step's print/PDF recap, and renderAnswersReportHtml. */
export function buildReportRows(flow: Flow, answers: Answers): ReportRow[] {
  const reviewable = flow.steps.filter(
    (s) => s.type !== "intro" && s.type !== "review" && s.type !== "confirmation",
  )
  return reviewable.map((s) => {
    const value = answers[s.id]
    const media = collectImages(s, value)
    return {
      icon: defaultIcon(s),
      title: s.title ?? s.id,
      value: formatAnswer(s, value),
      media: media.length > 0 ? media : undefined,
    }
  })
}
