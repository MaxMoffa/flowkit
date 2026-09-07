import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields, contentTextSchema } from "./schema"

export const introStepSchema = z.object({
  ...baseStepFields,
  type: z.literal("intro"),
  cta: z.string().default("Inizia"),
  livePill: z.string().optional(),
  /**
   * Small print rendered under the start button, in the footer. `ContentText`
   * (literal string or `{ key, fallback? }`) with the same restricted markdown as the
   * rest of the library — bold, italic, links, lists — so a clickable link is
   * allowed and an external one opens in a new tab (`rel="noopener"`), see
   * `FlowMarkdown`.
   *
   * Intended for a platform like FlowLab to attach a standing disclaimer to flows its
   * users author: e.g. "This flow was created by a third party; FlowLab is not
   * responsible for its content — [terms](https://...)". Purely presentational: it
   * adds no field, no validation, no gate on advancing.
   */
  ctaFootnote: contentTextSchema.optional(),
})

export type IntroStep = z.infer<typeof introStepSchema>

registerStepType({
  type: "intro",
  schema: introStepSchema,
  validate: () => true,
  role: "intro",
})
