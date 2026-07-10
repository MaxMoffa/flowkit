import type { ThemeTokens } from "./notion-clean"
import { notionCleanDark, notionCleanLight } from "./notion-clean"
import { mintFreshDark, mintFreshLight } from "./mint-fresh"
import { midnightInkDark, midnightInkLight } from "./midnight-ink"
import { sunsetClayDark, sunsetClayLight } from "./sunset-clay"
import { roseQuartzDark, roseQuartzLight } from "./rose-quartz"
import { showcaseDark, showcaseLight } from "./showcase"

export type { ThemeTokens }
export { notionCleanLight, notionCleanDark }
export { mintFreshLight, mintFreshDark }
export { midnightInkLight, midnightInkDark }
export { sunsetClayLight, sunsetClayDark }
export { roseQuartzLight, roseQuartzDark }
export { showcaseLight, showcaseDark }

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

export const sunsetClay: Theme = {
  name: "sunset-clay",
  label: "Sunset Clay",
  light: sunsetClayLight,
  dark: sunsetClayDark,
}

export const roseQuartz: Theme = {
  name: "rose-quartz",
  label: "Rose Quartz",
  light: roseQuartzLight,
  dark: roseQuartzDark,
}

export const showcase: Theme = {
  name: "showcase",
  label: "Showcase (demo feature)",
  light: showcaseLight,
  dark: showcaseDark,
}

export const themes: Record<string, Theme> = {
  "notion-clean": notionClean,
  "mint-fresh": mintFresh,
  "midnight-ink": midnightInk,
  "sunset-clay": sunsetClay,
  "rose-quartz": roseQuartz,
  showcase: showcase,
}

const COLOR_RADIUS_VAR_MAP: Record<string, keyof ThemeTokens> = {
  "--fk-text": "text",
  "--fk-text2": "text2",
  "--fk-canvas": "canvas",
  "--fk-soft": "soft",
  "--fk-surface": "surface",
  "--fk-border": "border",
  "--fk-accent": "accent",
  "--fk-accent-soft": "accentSoft",
  "--fk-success": "success",
  "--fk-success-soft": "successSoft",
  "--fk-warning": "warning",
  "--fk-warning-soft": "warningSoft",
  "--fk-danger": "danger",
  "--fk-danger-soft": "dangerSoft",
  "--fk-radius-sm": "radiusSm",
  "--fk-radius-md": "radiusMd",
  "--fk-radius-lg": "radiusLg",
  "--fk-radius-xl": "radiusXl",
}

function tokensToCssVars(tokens: ThemeTokens): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const [cssVar, key] of Object.entries(COLOR_RADIUS_VAR_MAP)) {
    vars[cssVar] = tokens[key] as string
  }
  vars["--fk-space-xs"] = tokens.spacing.xs
  vars["--fk-space-sm"] = tokens.spacing.sm
  vars["--fk-space-md"] = tokens.spacing.md
  vars["--fk-space-lg"] = tokens.spacing.lg
  vars["--fk-space-xl"] = tokens.spacing.xl
  vars["--fk-space-xxl"] = tokens.spacing.xxl
  vars["--fk-space-xxxl"] = tokens.spacing.xxxl

  if (tokens.fonts?.heading) vars["--fk-font-heading"] = tokens.fonts.heading
  if (tokens.fonts?.body) vars["--fk-font-body"] = tokens.fonts.body
  if (tokens.fonts?.headingSize) vars["--fk-font-heading-size"] = tokens.fonts.headingSize
  if (tokens.fonts?.bodySize) vars["--fk-font-body-size"] = tokens.fonts.bodySize
  if (tokens.images?.background) vars["--fk-image-background"] = `url("${tokens.images.background}")`
  if (tokens.images?.logo) vars["--fk-image-logo"] = `url("${tokens.images.logo}")`

  return vars
}

/**
 * Converts a partial subset of tokens (used for the per-step theme
 * override, v2.10) into only the CSS vars corresponding to the fields
 * present. Doesn't touch fonts/spacing/images: the per-step override is
 * limited to colors, radii and images to avoid a single step throwing off
 * the layout.
 */
export function partialTokensToCssVars(partial: Partial<ThemeTokens>): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const [cssVar, key] of Object.entries(COLOR_RADIUS_VAR_MAP)) {
    const value = partial[key]
    if (typeof value === "string") vars[cssVar] = value
  }
  if (partial.images?.background) vars["--fk-image-background"] = `url("${partial.images.background}")`
  if (partial.images?.logo) vars["--fk-image-logo"] = `url("${partial.images.logo}")`
  return vars
}

/**
 * Returns the custom font URLs to load for the theme (self-hosted Google
 * Fonts, CDN, etc.). Framework-agnostic: only returns the data, injecting
 * into the DOM (<link rel="stylesheet">) is each renderer's responsibility
 * (react/vue/svelte/vanilla).
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
