import type { ThemeTokens } from "./warm-paper"
import { createThemeTokens } from "./create-theme"

export const scarletInkLight: ThemeTokens = createThemeTokens({
  text: "#2A2422",
  text2: "#877C79",
  canvas: "#FFFFFF",
  soft: "#FCF4F3",
  surface: "#F8E8E6",
  border: "#EFD9D5",
  accent: "#E04442",
  accentSoft: "#FBE3E2",
  success: "#46A171",
  successSoft: "#E7F1EC",
  warning: "#C9792F",
  warningSoft: "#F7EBDD",
  danger: "#A81E12",
  dangerSoft: "#F6DEDB",
})

export const scarletInkDark: ThemeTokens = createThemeTokens({
  text: "#F6E9E7",
  text2: "#B99C97",
  canvas: "#211917",
  soft: "#2A201E",
  surface: "#332624",
  border: "#47322E",
  accent: "#F16D66",
  accentSoft: "#3A2321",
  success: "#5CBF8A",
  successSoft: "#1F332A",
  warning: "#E0985A",
  warningSoft: "#38291A",
  danger: "#EC6A5E",
  dangerSoft: "#3A211E",
})
