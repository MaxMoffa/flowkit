import { registerStepType } from "./registry"
import {
  introStepSchema,
  locationStepSchema,
  selectCardsStepSchema,
  scaleStepSchema,
  chipsStepSchema,
  facesStepSchema,
  notesStepSchema,
  mediaStepSchema,
  fileStepSchema,
  dateTimeStepSchema,
  npsStepSchema,
  multiSelectStepSchema,
  radioStepSchema,
  textStepSchema,
  reviewStepSchema,
  confirmationStepSchema,
} from "./schema"

/**
 * Registration of the built-in step types. Imported for its side effect from
 * index.ts: anyone who only consumes parseFlow/isStepValid doesn't need to change anything.
 */

registerStepType({
  type: "intro",
  schema: introStepSchema,
  validate: () => true,
  role: "intro",
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
  type: "notes",
  schema: notesStepSchema,
  validate: (_step, value) => typeof value === "string" && value.trim().length > 0,
})

registerStepType({
  type: "media",
  schema: mediaStepSchema,
  validate: (_step, value) => Array.isArray(value) && value.length > 0,
})

registerStepType({
  type: "file",
  schema: fileStepSchema,
  validate: (_step, value) => Array.isArray(value) && value.length > 0,
})

registerStepType({
  type: "date-time",
  schema: dateTimeStepSchema,
  validate: (step, value) => {
    if (typeof value !== "string" || value.trim().length === 0) return false
    if (step.min && value < step.min) return false
    if (step.max && value > step.max) return false
    return true
  },
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
  type: "radio",
  schema: radioStepSchema,
  validate: (_step, value) => typeof value === "string" && value.length > 0,
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
  role: "confirmation",
})
