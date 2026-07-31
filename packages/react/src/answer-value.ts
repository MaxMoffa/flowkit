import { isUploadedItemArray, type UploadedItem } from "@flowkit-io/core"

/**
 * Shared shape-recognition for a raw (step-unaware) answer value, used by every
 * "serialize the whole Answers object" consumer (answersToText for mailto/share bodies,
 * renderReceiptEmailHtml for the HTML email template): both used to independently
 * re-detect "is this a data URL / an UploadedItem[] / a nested group answer", which had
 * already drifted into two slightly different implementations. This only classifies —
 * each consumer still decides its own textual/HTML output per kind, since a mailto body
 * and an HTML table cell render the same "3 allegati" fact differently on purpose.
 */
export type ClassifiedAnswer =
  | { kind: "empty" }
  | { kind: "data-url"; isImage: boolean; url: string }
  | { kind: "uploaded-items"; items: UploadedItem[] }
  | { kind: "nested"; value: Record<string, unknown> }
  | { kind: "array"; items: unknown[] }
  | { kind: "scalar"; value: unknown }

export function classifyAnswerValue(value: unknown): ClassifiedAnswer {
  if (value === null || value === undefined || value === "") return { kind: "empty" }
  if (typeof value === "string" && value.startsWith("data:")) {
    return { kind: "data-url", isImage: value.startsWith("data:image/"), url: value }
  }
  if (isUploadedItemArray(value)) return { kind: "uploaded-items", items: value }
  if (Array.isArray(value)) return { kind: "array", items: value }
  if (typeof value === "object") return { kind: "nested", value: value as Record<string, unknown> }
  return { kind: "scalar", value }
}
