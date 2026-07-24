import type { ThemeTokens } from "./notion-clean"
import { createThemeTokens } from "./create-theme"

export const mintFreshLight: ThemeTokens = createThemeTokens({
  text: "#1E2B27",
  text2: "#5F7A72",
  canvas: "#FFFFFF",
  soft: "#F3FBF7",
  surface: "#E7F5EE",
  border: "#D3EBDF",
  accent: "#16A87E",
  accentSoft: "#DEF6EC",
  success: "#2FA35E",
  successSoft: "#E3F5E8",
  warning: "#D89B3C",
  warningSoft: "#FBF0DC",
  danger: "#E0615A",
  dangerSoft: "#FBE6E4",
})

export const mintFreshDark: ThemeTokens = createThemeTokens({
  text: "#E7F5EE",
  text2: "#8FB3A5",
  canvas: "#0F1C18",
  soft: "#152420",
  surface: "#1B2C26",
  border: "#283B33",
  accent: "#33C596",
  accentSoft: "#173229",
  success: "#4CCB86",
  successSoft: "#16301F",
  warning: "#E4AC5C",
  warningSoft: "#332815",
  danger: "#EC7B74",
  dangerSoft: "#332120",
})
