import { registerStepType } from "./registry"
import {
  introStepSchema,
  locationStepSchema,
  selectCardsStepSchema,
  scaleStepSchema,
  chipsStepSchema,
  facesStepSchema,
  notesPhotoStepSchema,
  npsStepSchema,
  multiSelectStepSchema,
  textStepSchema,
  reviewStepSchema,
  confirmationStepSchema,
} from "./schema"

/**
 * Registrazione dei 12 tipi di step built-in. Import per side-effect da
 * index.ts: chi consuma solo parseFlow/isStepValid non deve cambiare nulla.
 */

registerStepType({
  type: "intro",
  schema: introStepSchema,
  validate: () => true,
})

registerStepType({
  type: "location",
  schema: locationStepSchema,
  validate: (_step, value) => typeof value === "string" && value.trim().length > 0,
})

registerStepType({
  type: "select-cards",
  schema: selectCardsStepSchema,
  validate: (step, value) => {
    if (step.multiple) return Array.isArray(value) && value.length > 0
    return typeof value === "string" && value.length > 0
  },
})

registerStepType({
  type: "scale",
  schema: scaleStepSchema,
  validate: (_step, value) => typeof value === "number",
})

registerStepType({
  type: "chips",
  schema: chipsStepSchema,
  validate: (step, value) => {
    if (step.multiple) return Array.isArray(value) && value.length > 0
    return typeof value === "string" && value.length > 0
  },
})

registerStepType({
  type: "faces",
  schema: facesStepSchema,
  validate: (_step, value) => typeof value === "string" && value.length > 0,
})

registerStepType({
  type: "notes-photo",
  schema: notesPhotoStepSchema,
  validate: (_step, value) =>
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (Boolean((value as { text?: string }).text?.trim()) ||
      Boolean((value as { photo?: string }).photo)),
})

registerStepType({
  type: "nps",
  schema: npsStepSchema,
  validate: (_step, value) => typeof value === "number",
})

registerStepType({
  type: "multi-select",
  schema: multiSelectStepSchema,
  validate: (step, value) => {
    const arr = Array.isArray(value) ? value : []
    if (arr.length < step.min) return false
    if (step.max !== undefined && arr.length > step.max) return false
    return step.min > 0 ? arr.length > 0 : true
  },
})

registerStepType({
  type: "text",
  schema: textStepSchema,
  validate: (step, value) => {
    if (typeof value !== "string" || value.trim().length === 0) return false
    if (step.variant === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    if (step.variant === "number") return !Number.isNaN(Number(value))
    return true
  },
})

registerStepType({
  type: "review",
  schema: reviewStepSchema,
  validate: () => true,
})

registerStepType({
  type: "confirmation",
  schema: confirmationStepSchema,
  validate: () => true,
})
