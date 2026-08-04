import DOMPurify from "dompurify"
import type { StepImage as StepImageValue } from "@flowkit-io/core"

/** Sanitizes raw SVG markup (the "icon" kind's value) before it's ever mounted via
 *  `dangerouslySetInnerHTML` or interpolated into a standalone HTML export — the only
 *  place in the library that renders author-supplied markup instead of plain text. */
export function sanitizeStepIcon(markup: string): string {
  return DOMPurify.sanitize(markup, { USE_PROFILES: { svg: true, svgFilters: true } })
}

const SIZE_CLASS: Record<"badge" | "review" | "inline", string> = {
  badge: "fk-intro-badge",
  review: "fk-review-icon",
  inline: "fk-title-icon",
}

export interface StepImageProps {
  image: StepImageValue | undefined
  size: "badge" | "review" | "inline"
}

export function StepImage({ image, size }: StepImageProps) {
  if (!image) return null
  const className = SIZE_CLASS[size]
  if (image.kind === "emoji") {
    return <span className={className}>{image.value}</span>
  }
  if (image.kind === "icon") {
    return (
      <span
        className={className}
        style={{ color: "currentColor" }}
        dangerouslySetInnerHTML={{ __html: sanitizeStepIcon(image.value) }}
      />
    )
  }
  return (
    <span className={className}>
      <img src={image.value} alt="" />
    </span>
  )
}

/** String-building twin of <StepImage>, for the standalone HTML export
 *  (`renderAnswersReportHtml`, no React tree to mount into). */
export function stepImageToHtml(image: StepImageValue | undefined, sizeClass: string): string {
  if (!image) return ""
  if (image.kind === "emoji") {
    const escaped = image.value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    return `<span class="${sizeClass}">${escaped}</span>`
  }
  if (image.kind === "icon") {
    return `<span class="${sizeClass}" style="color:currentColor">${sanitizeStepIcon(image.value)}</span>`
  }
  const escapedSrc = image.value.replace(/"/g, "&quot;")
  return `<span class="${sizeClass}"><img src="${escapedSrc}" alt="" /></span>`
}
