import { z } from "zod"
import { registerStepType, type ValidationIssue } from "./registry"
import { baseStepFields } from "./schema"

/**
 * "address" step (v2.42) — collects a postal address. Its main job is to feed a
 * tax calculation before the payment step (see `payment-stripe`'s `calculateTax`),
 * but it is a plain data step and works on its own.
 *
 * `country` is an ISO 3166-1 alpha-2 code. Left as a free input by default; set
 * `countries` to render a select instead (e.g. to restrict shipping regions).
 */
export const addressStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("address"),
  /** Optional whitelist rendered as a `<select>`. Absent = free 2-letter input. */
  countries: z.array(z.object({ code: z.string().length(2), label: z.string() })).optional(),
  /** Require `line1` + `city` too, not just country + postal code. Default false. */
  requireFullAddress: z.boolean().default(false),
})

export type AddressStep = z.infer<typeof addressStepSchema>

export type AddressValue = {
  country: string
  postalCode?: string
  state?: string
  city?: string
  line1?: string
  line2?: string
}

/** Narrows an untyped answer to an `AddressValue` with a plausible country code. */
export function asAddressValue(value: unknown): AddressValue | null {
  if (value === null || typeof value !== "object") return null
  const current = value as AddressValue
  if (typeof current.country !== "string" || !/^[A-Za-z]{2}$/.test(current.country)) return null
  return current
}

function addressIssue(step: AddressStep, value: unknown): ValidationIssue | null {
  const address = asAddressValue(value)
  if (!address) return step.required ? { rule: "required" } : null
  const missingCore = !address.postalCode && !address.line1
  if (missingCore) return { rule: "required" }
  if (step.requireFullAddress && (!address.line1 || !address.city)) return { rule: "required" }
  return null
}

registerStepType({
  type: "address",
  schema: addressStepSchema,
  validate: (step, value) => addressIssue(step, value) === null,
  getIssue: (step, value) => addressIssue(step, value),
})
