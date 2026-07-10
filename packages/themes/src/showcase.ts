import { notionCleanDark, notionCleanLight } from "./notion-clean"
import type { ThemeTokens } from "./notion-clean"

/**
 * Tema dimostrativo (non pensato per uso in produzione): mostra sfondo
 * pagina, barra di progresso a pallini, footer in cima e animazione slide
 * tra step, tutte feature opzionali del tema altrimenti invisibili se non
 * configurate. Selezionabile nel playground per verificarle a occhio e via
 * Playwright.
 */
const showcaseBackground =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ccircle cx='40' cy='40' r='2' fill='%23e6e5e3'/%3E%3C/svg%3E"

export const showcaseLight: ThemeTokens = {
  ...notionCleanLight,
  accent: "#8C5CD8",
  accentSoft: "#EDE4FA",
  images: { ...notionCleanLight.images, background: showcaseBackground },
  layout: { footerPosition: "top", progressVariant: "dots" },
  animation: { name: "slide", duration: 220 },
}

export const showcaseDark: ThemeTokens = {
  ...notionCleanDark,
  accent: "#A57CE8",
  accentSoft: "#332047",
  images: { ...notionCleanDark.images, background: showcaseBackground },
  layout: { footerPosition: "top", progressVariant: "dots" },
  animation: { name: "slide", duration: 220 },
}
