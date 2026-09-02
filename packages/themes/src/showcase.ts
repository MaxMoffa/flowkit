import { warmPaperDark, warmPaperLight } from "./warm-paper"
import type { ThemeTokens } from "./warm-paper"

/**
 * Demonstration theme (not meant for production use): shows a page
 * background, dots progress bar moved into the footer, top footer and a
 * slide animation between steps — all optional theme features otherwise
 * invisible if not configured. Selectable in the playground to check them
 * visually and via Playwright.
 */
const showcaseBackground =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ccircle cx='40' cy='40' r='2' fill='%23e6e5e3'/%3E%3C/svg%3E"

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
