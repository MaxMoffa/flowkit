export interface ThemeFontTokens {
  heading?: string
  body?: string
  headingSize?: string
  bodySize?: string
  /** URL of a font-face/stylesheet to inject (e.g. self-hosted Google Fonts or a CDN). */
  headingFontUrl?: string
  bodyFontUrl?: string
}

export interface ThemeImageTokens {
  /** Global background image for the flow. */
  background?: string
  /** Background image for a specific step id or type. */
  stepBackground?: Record<string, string>
  logo?: string
}

export interface ThemeLayoutTokens {
  /** Position of the header (back button + progress) and footer (CTA). Default: "top"/"bottom" (current behavior). */
  headerPosition?: "top" | "bottom"
  footerPosition?: "top" | "bottom"
  /** Progress bar variant: solid bar, dots, hidden, or the key of a registered custom component. Default: "bar". */
  progressVariant?: "bar" | "dots" | "hidden" | string
}

export interface ThemeAnimationTokens {
  /** Built-in "fade"/"slide" presets, "none" (default, no animation), or the name of custom classes provided by the consumer. */
  name?: "fade" | "slide" | "none" | string
  duration?: number
}

export interface ThemeTokens {
  text: string
  text2: string
  canvas: string
  soft: string
  surface: string
  border: string
  accent: string
  accentSoft: string
  success: string
  successSoft: string
  warning: string
  warningSoft: string
  danger: string
  dangerSoft: string
  radiusSm: string
  radiusMd: string
  radiusLg: string
  radiusXl: string
  spacing: Record<"xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl", string>
  /** Font customization (v2.3), optional: no default = unchanged CSS behavior. */
  fonts?: ThemeFontTokens
  /** Image customization (v2.3), optional: no default = unchanged CSS behavior. */
  images?: ThemeImageTokens
  /** Layout: header/footer position, progress bar variant. Optional, default = current behavior. */
  layout?: ThemeLayoutTokens
  /** Transition animation between steps. Optional, default "none" = no visual change. */
  animation?: ThemeAnimationTokens
}

export const notionCleanLight: ThemeTokens = {
  text: "#2C2C2B",
  text2: "#7D7A75",
  canvas: "#FFFFFF",
  soft: "#F9F8F7",
  surface: "#F0EFED",
  border: "#E6E5E3",
  accent: "#2783DE",
  accentSoft: "#E5F2FC",
  success: "#46A171",
  successSoft: "#E8F1EC",
  warning: "#D5803B",
  warningSoft: "#FBEBDE",
  danger: "#E56458",
  dangerSoft: "#FCE9E7",
  radiusSm: "10px",
  radiusMd: "14px",
  radiusLg: "20px",
  radiusXl: "28px",
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    xxl: "32px",
    xxxl: "48px",
  },
}

export const notionCleanDark: ThemeTokens = {
  text: "#EDECEA",
  text2: "#9B9892",
  canvas: "#1C1C1B",
  soft: "#232322",
  surface: "#2A2A29",
  border: "#3A3A38",
  accent: "#4B9FEF",
  accentSoft: "#213348",
  success: "#5CBF8A",
  successSoft: "#1F332A",
  warning: "#E0954D",
  warningSoft: "#3A2C1C",
  danger: "#EC7A6E",
  dangerSoft: "#3A2320",
  radiusSm: "10px",
  radiusMd: "14px",
  radiusLg: "20px",
  radiusXl: "28px",
  spacing: notionCleanLight.spacing,
}
