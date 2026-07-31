import type { Flow } from "@flowkit-io/core"
import { resolveText } from "@flowkit-io/core"
import { classifyAnswerValue } from "../../answer-value"

/** Recursively flattens answers (including nested objects from a "group" step) into plain text.
 *  Values that look like data URLs (e.g. base64 photos/files) are omitted: they don't make sense
 *  in a text/email summary and would needlessly bloat the message body. `flow`, when passed,
 *  resolves the attachment-count suffix ("allegato/i"/"attachment(s)") via flow.locale/flow.texts;
 *  omit it to keep the previous hardcoded Italian text. */
export function answersToText(answers: Record<string, unknown>, prefix = "", flow?: Flow): string {
  const attachmentSuffix = flow ? resolveText(flow, "attachmentSuffix") : "allegato/i"
  return Object.entries(answers)
    .flatMap(([key, value]) => {
      const label = prefix ? `${prefix}.${key}` : key
      const classified = classifyAnswerValue(value)
      switch (classified.kind) {
        case "empty":
        case "data-url":
          return []
        case "uploaded-items":
          return classified.items.length ? [`${label}: ${classified.items.length} ${attachmentSuffix}`] : []
        case "nested": {
          const nested = answersToText(classified.value, label, flow)
          return nested ? [nested] : []
        }
        case "array":
          return [`${label}: ${classified.items.join(", ")}`]
        case "scalar":
          return [`${label}: ${String(classified.value)}`]
      }
    })
    .join("\n")
}
