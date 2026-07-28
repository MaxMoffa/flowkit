import type { CSSProperties } from "react"
import type { MediaDisplayStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"

export function MediaDisplayStepView({ step }: StepComponentProps<MediaDisplayStep>) {
  const style: CSSProperties = {
    aspectRatio: step.aspectRatio,
    objectFit: step.fit,
    width: "100%",
  }
  return (
    <div className="fk-step fk-step-media-display">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      <div className="fk-media-display-frame">
        {step.kind === "video" ? (
          <video
            className="fk-media-display-video"
            style={style}
            src={step.src}
            poster={step.poster}
            autoPlay={step.autoplay}
            loop={step.loop}
            muted={step.muted}
            controls={step.controls}
            playsInline
          >
            {step.sources?.map((source) => (
              <source key={source.src} src={source.src} type={source.type} media={source.media} />
            ))}
          </video>
        ) : (
          <img
            className="fk-media-display-image"
            style={style}
            src={step.src}
            alt={step.alt ?? ""}
            srcSet={step.sources?.map((s) => s.src).join(", ") || undefined}
          />
        )}
      </div>
      {step.caption && <p className="fk-media-display-caption">{step.caption}</p>}
    </div>
  )
}
