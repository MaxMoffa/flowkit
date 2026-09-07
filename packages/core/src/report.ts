import type { Flow, Step, StepImage } from "./schema"
import type { Answers } from "./machine"
import { answerKey } from "./machine"
import { getStepTypeDefinition } from "./registry"
import { isUploadedItemArray, type UploadedItem } from "./upload-item"
import { asCatalogValue, catalogTotal, type CatalogStep } from "./catalog-step"
import { asAddressValue } from "./address-step"
import { asBarcodeScanValue } from "./barcode-scan-step"
import { formatMoney } from "./money"
import { resolveContentText } from "./i18n"

export function optionLabel(flow: Flow, step: Step, rawValue: string): string {
  if (
    step.type === "select-cards" ||
    step.type === "chips" ||
    step.type === "multi-select" ||
    step.type === "radio"
  ) {
    const option = step.options.find((o) => o.value === rawValue)
    return option ? resolveContentText(flow, option.label) : rawValue
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

/** Stripe payment method type → user-facing label for the report row. Types not
 *  listed fall through to a Title-Cased version of the raw type ("us_bank_account"
 *  → "Us Bank Account" is unlikely; the common ones are all covered). */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: "Carta",
  paypal: "PayPal",
  klarna: "Klarna",
  revolut_pay: "Revolut Pay",
  ideal: "iDEAL",
  bancontact: "Bancontact",
  sepa_debit: "Addebito SEPA",
  link: "Link",
  eps: "EPS",
  giropay: "giropay",
  p24: "Przelewy24",
  sofort: "Sofort",
  affirm: "Affirm",
  afterpay_clearpay: "Afterpay",
  amazon_pay: "Amazon Pay",
  cashapp: "Cash App Pay",
}

function formatPaymentMethod(value: unknown): string {
  if (value === null || typeof value !== "object") return "—"
  const v = value as { summary?: { type?: string; brand?: string; last4?: string } }
  const summary = v.summary
  if (!summary || typeof summary.type !== "string") return "—"
  if (summary.type === "card" && summary.last4) {
    const brand = summary.brand ? summary.brand.replace(/\b\w/g, (c) => c.toUpperCase()) : "Carta"
    return `${brand} •••• ${summary.last4}`
  }
  return (
    PAYMENT_METHOD_LABELS[summary.type] ??
    summary.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

function formatCatalogAnswer(flow: Flow, step: CatalogStep, value: unknown): string {
  const parsed = asCatalogValue(value)
  const lines = (parsed?.items ?? []).filter((line) => line.quantity > 0)
  if (lines.length === 0) return "—"
  const labels = new Map(step.items.map((item) => [item.value, resolveContentText(flow, item.label)]))
  const parts = lines.map((line) => `${line.quantity}× ${labels.get(line.value) ?? line.value}`)
  return `🛒 ${parts.join(", ")} · ${formatMoney(catalogTotal(step, value), step.currency)}`
}

export function formatAnswer(flow: Flow, step: Step, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"
  if (step.type === "media" || step.type === "file" || step.type === "photo") {
    const items = Array.isArray(value) ? value : []
    if (items.length === 0) return "—"
    // A `file` step lists the file names (a PDF/doc has a meaningful name); `media`/
    // `photo` stay a count (photos rarely have useful names).
    if (step.type === "file" && isUploadedItemArray(items)) {
      return `📎 ${items.map((i) => i.name).join(", ")}`
    }
    return `${step.type === "file" ? "📎" : "📷"}×${items.length}`
  }
  if (step.type === "barcode-scan") {
    const scanned = asBarcodeScanValue(value)
    return scanned ? `🔎 ${scanned.code}` : "—"
  }
  if (step.type === "catalog" || step.type === "product") {
    return formatCatalogAnswer(flow, step as CatalogStep, value)
  }
  if (step.type === "address") {
    const address = asAddressValue(value)
    if (!address) return "—"
    return [address.line1, address.line2, [address.postalCode, address.city].filter(Boolean).join(" "), address.state, address.country]
      .filter((part) => part && String(part).trim())
      .join(", ")
  }
  if (step.type === "checkbox") return value === true ? "✓ Accettato" : "—"
  if (step.type === "signature") return "✍️ Firma"
  if (step.type === "payment-stripe") return formatPaymentMethod(value)
  if (Array.isArray(value)) return value.map((v) => optionLabel(flow, step, String(v))).join(", ")
  if ((step.type as string) === "group") {
    const children = (step as unknown as { steps: Step[] }).steps
    const answers = value as Record<string, unknown>
    return (
      children
        .map((child) => formatAnswer(flow, child, answers[answerKey(child)]))
        .filter((v) => v && v !== "—")
        .join(", ") || "—"
    )
  }
  if (typeof value === "object") return "—"
  return optionLabel(flow, step, String(value))
}

/** Fallback emoji per step type, used when a step has no `image` of its own. */
const DEFAULT_TYPE_EMOJI: Record<string, string> = {
  location: "📍",
  "location-leaflet": "📍",
  "select-cards": "🏷️",
  catalog: "🛒",
  product: "🛍️",
  address: "📮",
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
  photo: "📸",
  "barcode-scan": "🔎",
  "date-time": "🗓️",
  "payment-stripe": "💳",
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
  if ((step.type === "media" || step.type === "file" || step.type === "photo") && isUploadedItemArray(value)) {
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
      title: s.title !== undefined ? resolveContentText(flow, s.title) : s.id,
      value: formatAnswer(flow, s, value),
      media: media.length > 0 ? media : undefined,
    }
  })
}
