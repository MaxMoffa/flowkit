import type { CSSProperties, ComponentType } from "react"
import type { Step } from "@flowkit-io/core"
import type { Theme, ThemeMode, ThemeTokens } from "@flowkit-io/themes"
import { notionClean, partialTokensToCssVars } from "@flowkit-io/themes"
import { getProgressComponent, type ProgressComponentProps } from "./progress-registry"
import { BarProgress } from "./progress/BarProgress"

const CONTENT_ALIGN_TO_FLEX: Record<"top" | "center" | "bottom", string> = {
  top: "flex-start",
  center: "center",
  bottom: "flex-end",
}

const DEFAULT_ANIMATION_MS = 250

export interface FlowRunnerLayout {
  /** Step background image, applied on `.fk-root`. */
  rootStyle: CSSProperties | undefined
  /** Per-step theme override plus animation duration, applied on the step scope. */
  scopeStyle: CSSProperties | undefined
  scrollInnerStyle: CSSProperties
  animationClass: string
  headerOrder: number
  footerOrder: number
  progressPosition: "header" | "footer"
  /** null when the theme asks for no progress indicator at all. */
  ProgressComponent: ComponentType<ProgressComponentProps> | null
}

/**
 * Turns theme tokens plus the current step into the CSS variables, ordering and classes
 * the chrome needs. Split out of FlowRunner, which was resolving all of this inline on
 * top of managing flow state, navigation and rendering.
 */
export function useFlowRunnerLayout(
  step: Step,
  theme: Theme | undefined,
  mode: ThemeMode | undefined,
  direction: "next" | "prev",
): FlowRunnerLayout {
  const tokens = mode === "dark" ? (theme ?? notionClean).dark : (theme ?? notionClean).light

  const stepBgUrl =
    tokens.images?.stepBackground?.[step.id] ?? tokens.images?.stepBackground?.[step.type]
  const rootStyle = stepBgUrl
    ? ({ "--fk-image-step-background": `url(${stepBgUrl})` } as CSSProperties)
    : undefined

  const themeOverride = (step as { themeOverride?: Partial<ThemeTokens> }).themeOverride
  const stepThemeVars = themeOverride
    ? (partialTokensToCssVars(themeOverride) as CSSProperties)
    : undefined

  const animationName = tokens.animation?.name ?? "none"
  const animationClass =
    animationName === "none" ? "" : ` fk-anim-${animationName} fk-anim-dir-${direction}`
  const animationVars =
    animationName === "none"
      ? undefined
      : ({
          "--fk-anim-duration": `${tokens.animation?.duration ?? DEFAULT_ANIMATION_MS}ms`,
        } as CSSProperties)

  // fullContainer map steps need .fk-step-theme-scope to keep filling the viewport, so
  // they always stay "top" (i.e. unaligned/unshrunk) regardless of theme/step config.
  const isFullContainerLocation = (step as { fullContainer?: boolean }).fullContainer === true
  const contentAlign = isFullContainerLocation
    ? "top"
    : ((step as { contentAlign?: "top" | "center" | "bottom" }).contentAlign ??
      tokens.layout?.contentAlign ??
      "top")

  const progressVariant = tokens.layout?.progressVariant ?? "bar"

  return {
    rootStyle,
    scopeStyle: stepThemeVars || animationVars ? { ...stepThemeVars, ...animationVars } : undefined,
    scrollInnerStyle: {
      "--fk-content-align": CONTENT_ALIGN_TO_FLEX[contentAlign],
      "--fk-content-flex": contentAlign === "top" ? "1" : "none",
    } as CSSProperties,
    animationClass,
    headerOrder: tokens.layout?.headerPosition === "bottom" ? 3 : 1,
    footerOrder: tokens.layout?.footerPosition === "top" ? 0 : 4,
    progressPosition: tokens.layout?.progressPosition ?? "header",
    ProgressComponent:
      progressVariant === "hidden" ? null : (getProgressComponent(progressVariant) ?? BarProgress),
  }
}
