import type { ThemeTokens } from "./notion-clean"
import { createThemeTokens } from "./create-theme"

export const midnightInkLight: ThemeTokens = createThemeTokens({
  text: "#211F2E",
  text2: "#6E6A85",
  canvas: "#FFFFFF",
  soft: "#F6F5FB",
  surface: "#ECEAF6",
  border: "#DEDBEF",
  accent: "#6753E0",
  accentSoft: "#ECE8FB",
  success: "#3F9E6D",
  successSoft: "#E5F3EB",
  warning: "#D68A3E",
  warningSoft: "#FBEEDD",
  danger: "#DD5C71",
  dangerSoft: "#FAE6EA",
})

export const midnightInkDark: ThemeTokens = createThemeTokens({
  text: "#EDEBFA",
  text2: "#9C97BE",
  canvas: "#171526",
  soft: "#1E1B30",
  surface: "#26223A",
  border: "#352F4C",
  accent: "#8B76F2",
  accentSoft: "#2A2447",
  success: "#5BC493",
  successSoft: "#1D3327",
  warning: "#E5A55D",
  warningSoft: "#372A18",
  danger: "#EA7C8F",
  dangerSoft: "#372025",
})
