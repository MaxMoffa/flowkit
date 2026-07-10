import type { ThemeTokens } from "./notion-clean"
import { notionCleanDark, notionCleanLight } from "./notion-clean"
import { mintFreshDark, mintFreshLight } from "./mint-fresh"
import { midnightInkDark, midnightInkLight } from "./midnight-ink"

export type { ThemeTokens }
export { notionCleanLight, notionCleanDark }
export { mintFreshLight, mintFreshDark }
export { midnightInkLight, midnightInkDark }

export type ThemeMode = "light" | "dark"

export interface Theme {
  name: string
  label: string
  light: ThemeTokens
  dark: ThemeTokens
}

export const notionClean: Theme = {
  name: "notion-clean",
  label: "Notion Clean",
  light: notionCleanLight,
  dark: notionCleanDark,
}

export const mintFresh: Theme = {
  name: "mint-fresh",
  label: "Mint Fresh",
  light: mintFreshLight,
  dark: mintFreshDark,
}

export const midnightInk: Theme = {
  name: "midnight-ink",
  label: "Midnight Ink",
  light: midnightInkLight,
  dark: midnightInkDark,
}

export const themes: Record<string, Theme> = {
  "notion-clean": notionClean,
  "mint-fresh": mintFresh,
  "midnight-ink": midnightInk,
}

function tokensToCssVars(tokens: ThemeTokens): Record<string, string> {
  const vars: Record<string, string> = {
    "--fk-text": tokens.text,
    "--fk-text2": tokens.text2,
    "--fk-canvas": tokens.canvas,
    "--fk-soft": tokens.soft,
    "--fk-surface": tokens.surface,
    "--fk-border": tokens.border,
    "--fk-accent": tokens.accent,
    "--fk-accent-soft": tokens.accentSoft,
    "--fk-success": tokens.success,
    "--fk-success-soft": tokens.successSoft,
    "--fk-warning": tokens.warning,
    "--fk-warning-soft": tokens.warningSoft,
    "--fk-danger": tokens.danger,
    "--fk-danger-soft": tokens.dangerSoft,
    "--fk-radius-sm": tokens.radiusSm,
    "--fk-radius-md": tokens.radiusMd,
    "--fk-radius-lg": tokens.radiusLg,
    "--fk-radius-xl": tokens.radiusXl,
    "--fk-space-xs": tokens.spacing.xs,
    "--fk-space-sm": tokens.spacing.sm,
    "--fk-space-md": tokens.spacing.md,
    "--fk-space-lg": tokens.spacing.lg,
    "--fk-space-xl": tokens.spacing.xl,
    "--fk-space-xxl": tokens.spacing.xxl,
    "--fk-space-xxxl": tokens.spacing.xxxl,
  }

  if (tokens.fonts?.heading) vars["--fk-font-heading"] = tokens.fonts.heading
  if (tokens.fonts?.body) vars["--fk-font-body"] = tokens.fonts.body
  if (tokens.fonts?.headingSize) vars["--fk-font-heading-size"] = tokens.fonts.headingSize
  if (tokens.fonts?.bodySize) vars["--fk-font-body-size"] = tokens.fonts.bodySize
  if (tokens.images?.background) vars["--fk-image-background"] = `url(${tokens.images.background})`
  if (tokens.images?.logo) vars["--fk-image-logo"] = `url(${tokens.images.logo})`

  return vars
}

/**
 * Ritorna gli URL dei font custom da caricare per il tema (Google Fonts
 * self-hosted, CDN, ecc.). Framework-agnostic: restituisce solo i dati,
 * l'iniezione nel DOM (<link rel="stylesheet">) è responsabilità di ciascun
 * renderer (react/vue/svelte/vanilla).
 */
export function injectThemeFontLinks(theme: Theme, mode: ThemeMode = "light"): string[] {
  const tokens = mode === "dark" ? theme.dark : theme.light
  return [tokens.fonts?.headingFontUrl, tokens.fonts?.bodyFontUrl].filter(
    (url): url is string => Boolean(url),
  )
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
