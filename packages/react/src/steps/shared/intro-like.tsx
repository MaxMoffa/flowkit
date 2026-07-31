import type { StepImage as StepImageValue } from "@flowkit-io/core"
import { FlowMarkdown } from "../../markdown"
import { StepImage } from "./step-image"

/** Shared visual structure of `intro` and `info` (v2.34): live pill, badge image,
 *  title, subtitle. `intro` additionally drives the flow's CTA/footer (via its
 *  "intro" role); `info` has no livePill and uses the flow's normal footer nav. */
export function IntroLikeView({
  title,
  subtitle,
  image,
  livePill,
}: {
  title?: string
  subtitle?: string
  image?: StepImageValue
  livePill?: string
}) {
  return (
    <>
      {livePill && (
        <div className="fk-intro-pill">
          <span className="fk-live-dot" />
          <FlowMarkdown text={livePill} variant="inline" />
        </div>
      )}
      <StepImage image={image} size="badge" />
      {title && <h1 className="fk-title"><FlowMarkdown text={title} variant="inline" /></h1>}
      {subtitle && <p className="fk-subtitle"><FlowMarkdown text={subtitle} variant="block" /></p>}
    </>
  )
}
