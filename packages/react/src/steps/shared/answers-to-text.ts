import { isUploadedItemArray } from "@flowkit-io/core"

/** Recursively flattens answers (including nested objects from a "group" step) into plain text.
 *  Values that look like data URLs (e.g. base64 photos/files) are omitted or summarized as a
 *  count: they don't make sense in a text/email summary and would needlessly bloat the message
 *  body. */
export function answersToText(answers: Record<string, unknown>, prefix = ""): string {
  return Object.entries(answers)
    .flatMap(([key, value]) => {
      const label = prefix ? `${prefix}.${key}` : key
      if (value === null || value === undefined || value === "") return []
      if (typeof value === "string" && value.startsWith("data:")) return []
      if (isUploadedItemArray(value)) return value.length ? [`${label}: ${value.length} allegato/i`] : []
      if (typeof value === "object" && !Array.isArray(value)) {
        const nested = answersToText(value as Record<string, unknown>, label)
        return nested ? [nested] : []
      }
      return [`${label}: ${Array.isArray(value) ? value.join(", ") : String(value)}`]
    })
    .join("\n")
}
