import { warmPaperDark, warmPaperLight } from "./warm-paper"
import type { ThemeTokens } from "./warm-paper"

/**
 * Demonstration theme (not meant for production use): shows a page
 * background, dots progress bar moved into the footer, top footer and a
 * slide animation between steps — all optional theme features otherwise
 * invisible if not configured. Selectable in the playground to check them
 * visually and via Playwright.
 */
/** `images.background` is rendered with `background-size: cover; background-repeat:
 *  no-repeat` (see style.css) — built for a full-bleed photo, not a tileable pattern.
 *  A single 80×80 dot stretched under that contract fills the whole flow as one huge
 *  circle instead of a subtle texture, so the dot grid has to be pre-tiled inside the
 *  SVG itself (a `<pattern>` filling an 800×800 canvas) before it ever reaches CSS. */
const showcaseBackground =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800'%3E%3Cdefs%3E%3Cpattern id='dots' width='80' height='80' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='40' cy='40' r='2' fill='%23e6e5e3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='800' height='800' fill='url(%23dots)'/%3E%3C/svg%3E"

export const showcaseLight: ThemeTokens = {
  ...warmPaperLight,
  accent: "#8C5CD8",
  accentSoft: "#EDE4FA",
  images: { ...warmPaperLight.images, background: showcaseBackground },
  layout: { footerPosition: "top", progressVariant: "dots", progressPosition: "footer", contentAlign: "center" },
  animation: { name: "slide", duration: 220 },
}

export const showcaseDark: ThemeTokens = {
  ...warmPaperDark,
  accent: "#A57CE8",
  accentSoft: "#332047",
  images: { ...warmPaperDark.images, background: showcaseBackground },
  layout: { footerPosition: "top", progressVariant: "dots", progressPosition: "footer", contentAlign: "center" },
  animation: { name: "slide", duration: 220 },
}
