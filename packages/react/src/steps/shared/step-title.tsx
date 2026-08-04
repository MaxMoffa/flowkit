import type { StepImage as StepImageValue } from "@flowkit-io/core"
import { FlowMarkdown } from "../../markdown"
import { StepImage } from "./step-image"

/** Title header shared by every non-intro/info step type: an optional icon (v2.36,
 *  same `image` field intro/info already render via `IntroLikeView`) inline next to the
 *  title text, inside the same heading element `.fk-title` always used — not a
 *  wrapping `<div>`, so the existing `.fk-title:not(:has(+ .fk-subtitle))` sibling
 *  selector (style.css) keeps working unmodified. Renders nothing when both `title`
 *  and `image` are unset. */
export function StepTitle({
  image,
  title,
  level = "h2",
}: {
  image?: StepImageValue
  title?: string
  level?: "h1" | "h2"
}) {
  if (!title && !image) return null
  const Tag = level
  return (
    <Tag className="fk-title">
      <StepImage image={image} size="inline" />
      {title && <FlowMarkdown text={title} variant="inline" />}
    </Tag>
  )
}
