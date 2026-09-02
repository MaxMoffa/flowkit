import type { ThemeTokens } from "./warm-paper"
import { warmPaperLight } from "./warm-paper"

/** The tokens that actually distinguish one theme from another. */
export type ThemeColors = Pick<
  ThemeTokens,
  | "text"
  | "text2"
  | "canvas"
  | "soft"
  | "surface"
  | "border"
  | "accent"
  | "accentSoft"
  | "success"
  | "successSoft"
  | "warning"
  | "warningSoft"
  | "danger"
  | "dangerSoft"
>

/** Radii are part of the design language, not of the palette: every shipped theme uses
 *  these, and warm-paper spells them out because it is the documented reference. */
const SHARED_RADII = {
  radiusSm: "10px",
  radiusMd: "14px",
  radiusLg: "20px",
  radiusXl: "28px",
} as const

/**
 * Builds a full token set from a palette, filling in the radii and spacing shared by
 * every theme. Each extra theme used to repeat those eight lines twice, once per mode.
 * Pass `extra` to override anything (fonts, images, a different radius scale).
 */
export function createThemeTokens(
  colors: ThemeColors,
  extra: Partial<ThemeTokens> = {},
): ThemeTokens {
  return {
    ...colors,
    ...SHARED_RADII,
    spacing: warmPaperLight.spacing,
    ...extra,
  }
}
