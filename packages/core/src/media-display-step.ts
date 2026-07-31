import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields } from "./schema"

/**
 * "media-display" step: read-only image/video shown before/during a question
 * (e.g. "what do you think of this?"). Distinct from "media" (upload/capture):
 * no file picker, no UploadedItem[] answer, just a configured src to render.
 */
export const mediaDisplayStepSchema = z
  .object({
    ...baseStepFields,
    type: z.literal("media-display"),
    kind: z.enum(["image", "video"]).default("image"),
    src: z.string().min(1),
    /** Additional responsive sources: <source> children for video, or extra srcSet
     *  candidates for image. */
    sources: z
      .array(z.object({ src: z.string().min(1), type: z.string().optional(), media: z.string().optional() }))
      .optional(),
    /** Poster frame shown before playback starts (video only). */
    poster: z.string().optional(),
    alt: z.string().optional(),
    caption: z.string().optional(),
    /** Video-only playback options. */
    autoplay: z.boolean().default(false),
    loop: z.boolean().default(false),
    muted: z.boolean().default(false),
    controls: z.boolean().default(true),
    /** CSS aspect-ratio (e.g. "16/9", "1/1"). Unset = intrinsic media size. */
    aspectRatio: z.string().optional(),
    fit: z.enum(["cover", "contain", "fill"]).default("cover"),
    /** Purely informational: collects no answer, so it must never block advancement
     *  by default (overrides baseStepFields' required:true default). */
    required: z.boolean().default(false),
  })
  .refine((step) => !(step.autoplay && !step.muted), {
    message: "autoplay:true requires muted:true (browser autoplay policy).",
    path: ["muted"],
  })

export type MediaDisplayStep = z.infer<typeof mediaDisplayStepSchema>

registerStepType({
  type: "media-display",
  schema: mediaDisplayStepSchema,
  validate: () => true,
})
