import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields } from "./schema"

export const confirmationStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("confirmation"),
  title: z.string().default("Grazie!"),
  message: z.string().optional(),
  emoji: z.string().optional(),
  stats: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  primaryCta: z.string().optional(),
  secondaryCta: z.string().optional(),
  /** Show/hide the primary "torna alla home" button. Default: true (current behavior). */
  showHomeButton: z.boolean().default(true),
  /**
   * When set, the primary button navigates to this URL (window.location.href)
   * instead of resetting the in-memory flow state. Unset = current behavior
   * (acts as an in-app "start over"/home).
   */
  homeUrl: z.string().optional(),
  emailShare: z
    .object({
      enabled: z.boolean().default(false),
      subject: z.string().optional(),
      buttonLabel: z.string().default("Invia via email"),
      helpText: z.string().optional(),
    })
    .optional(),
  /**
   * Optional result actions, coexisting with emailShare (mailto).
   * `resultLink.createLink`/`emailApi.sendEmail` are functions injected by
   * the consumer (a pattern already used by mapAnswersToProperties in
   * notion.ts): they aren't JSON-serializable, so a flow using them must be
   * built as a TS/JS object, not loaded from plain JSON.
   */
  resultActions: z
    .object({
      pdfExport: z
        .object({
          enabled: z.boolean().default(false),
          buttonLabel: z.string().default("Scarica PDF"),
          documentTitle: z.string().optional(),
        })
        .optional(),
      resultLink: z
        .object({
          enabled: z.boolean().default(false),
          buttonLabel: z.string().default("Copia link"),
          helpText: z.string().optional(),
          createLink: z.custom<(answers: Record<string, unknown>) => Promise<{ url: string }>>(
            (v) => typeof v === "function",
          ),
        })
        .optional(),
      nativeShare: z
        .object({
          enabled: z.boolean().default(false),
          buttonLabel: z.string().default("Condividi"),
          shareTitle: z.string().optional(),
        })
        .optional(),
      emailApi: z
        .object({
          enabled: z.boolean().default(false),
          buttonLabel: z.string().default("Invia via email (server)"),
          helpText: z.string().optional(),
          sendEmail: z.custom<(email: string, answers: Record<string, unknown>) => Promise<void>>(
            (v) => typeof v === "function",
          ),
        })
        .optional(),
    })
    .optional(),
})

export type ConfirmationStep = z.infer<typeof confirmationStepSchema>

registerStepType({
  type: "confirmation",
  schema: confirmationStepSchema,
  validate: () => true,
  role: "confirmation",
})
