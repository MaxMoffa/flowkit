import type { ThemeTokens } from "./notion-clean"
import { notionCleanDark, notionCleanLight } from "./notion-clean"

export type { ThemeTokens }
export { notionCleanLight, notionCleanDark }

export type ThemeMode = "light" | "dark"

export interface Theme {
  name: string
  light: ThemeTokens
  dark: ThemeTokens
}

export const notionClean: Theme = {
  name: "notion-clean",
  light: notionCleanLight,
  dark: notionCleanDark,
}

export const themes: Record<string, Theme> = {
  "notion-clean": notionClean,
}

function tokensToCssVars(tokens: ThemeTokens): Record<string, string> {
  return {
    "--fk-text": tokens.text,
    "--fk-text2": tokens.text2,
    "--fk-canvas": tokens.canvas,
    "--fk-soft": tokens.soft,
    "--fk-surface": tokens.surface,
    "--fk-border": tokens.border,
    "--fk-accent": tokens.accent,
    "--fk-success": tokens.success,
    "--fk-warning": tokens.warning,
    "--fk-danger": tokens.danger,
    "--fk-radius-sm": tokens.radiusSm,
    "--fk-radius-md": tokens.radiusMd,
    "--fk-radius-lg": tokens.radiusLg,
    "--fk-space-xs": tokens.spacing.xs,
    "--fk-space-sm": tokens.spacing.sm,
    "--fk-space-md": tokens.spacing.md,
    "--fk-space-lg": tokens.spacing.lg,
    "--fk-space-xl": tokens.spacing.xl,
    "--fk-space-xxl": tokens.spacing.xxl,
    "--fk-space-xxxl": tokens.spacing.xxxl,
  }
}

export function themeToCssVars(theme: Theme, mode: ThemeMode = "light"): Record<string, string> {
  return tokensToCssVars(mode === "dark" ? theme.dark : theme.light)
}

export function themeToCssString(theme: Theme, mode: ThemeMode = "light"): string {
  const vars = themeToCssVars(theme, mode)
  return Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join("\n")
}
