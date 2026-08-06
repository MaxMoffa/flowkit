# @flowkit-io/themes

Design tokens and CSS variables themes for Flowkit. This package provides pre-built themes and utilities to customize appearance via design tokens (colors, spacing, fonts, radii).

## Installation and usage in this repo

This package is part of the flowkit monorepo. Install dependencies at the repo root:

```bash
npm install
```

The package is available as `@flowkit-io/themes` in workspace imports:

```typescript
import { notionClean } from "@flowkit-io/themes"
```

## Main exports

- **Pre-built themes (light + dark variants):**
  - `notionClean` (default, minimal warm aesthetic)
  - `mintFresh` (fresh, modern)
  - `midnightInk` (dark, professional)
  - `sunsetClay` (warm, earthy)
  - `roseQuartz` (soft, pink)
  - `showcase` (demo/experimental features)
  - `themes` – Record of all themes by name
- **Theme utilities:**
  - `themeToCssVars(theme, mode)` – Convert a theme object to CSS variable declarations (object)
  - `themeToCssString(theme, mode)` – Convert to CSS string (for `<style>` tags)
  - `injectThemeFontLinks(theme, mode)` – Get font URLs to load (returns array)
  - `partialTokensToCssVars(partial)` – Convert partial token overrides to CSS vars (for per-step theme overrides)
- **Types:**
  - `Theme` – Theme object with name, label, light/dark token sets
  - `ThemeTokens` – All design tokens (colors, spacing, fonts, radii, images)
  - `ThemeMode` – "light" | "dark"
- **Theme creation:**
  - `createThemeTokens(colors, options)` – Factory function to create a custom theme

## Theme structure

Each theme has light and dark variants. A `Theme` object:

```typescript
interface Theme {
  name: string                  // e.g., "notion-clean"
  label: string                 // e.g., "Notion Clean"
  light: ThemeTokens           // Light mode colors, spacing, fonts, etc.
  dark: ThemeTokens            // Dark mode colors, spacing, fonts, etc.
}
```

**ThemeTokens** includes:

```typescript
{
  // Colors
  text: string                   // Primary text color
  text2: string                  // Secondary text color
  canvas: string                 // Background
  soft: string                   // Light background (for sections)
  surface: string                // Panel/card background
  border: string                 // Border color
  accent: string                 // Primary action/emphasis color
  accentSoft: string             // Light accent tint
  success: string                // Success/positive color
  successSoft: string            // Light success tint
  warning: string                // Warning color
  warningSoft: string            // Light warning tint
  danger: string                 // Error/danger color
  dangerSoft: string             // Light danger tint

  // Spacing (all in px)
  spacing: {
    xs: string                   // Small gap (4px)
    sm: string                   // (8px)
    md: string                   // (12px)
    lg: string                   // (16px)
    xl: string                   // (24px)
    xxl: string                  // (32px)
    xxxl: string                 // (48px)
  }

  // Radii (all in px)
  radiusSm: string               // (8px)
  radiusMd: string               // (12px)
  radiusLg: string               // (20px)
  radiusXl: string               // (24px)

  // Fonts (optional)
  fonts?: {
    heading?: string             // Font family for headings
    body?: string                // Font family for body text
    headingSize?: string         // Font size for headings
    bodySize?: string            // Font size for body
    headingFontUrl?: string      // URL to font file/CDN (self-hosted Google Fonts, etc.)
    bodyFontUrl?: string         // URL to font file/CDN
  }

  // Images (optional)
  images?: {
    background?: string          // Background image URL or data:URI
    logo?: string                // Logo image URL or data:URI
  }
}
```

## Basic example

```typescript
import { notionClean, themeToCssVars, createThemeTokens } from "@flowkit-io/themes"

// Use a pre-built theme
const theme = notionClean
const cssVars = themeToCssVars(theme, "light")  // Returns { "--fk-accent": "#2783DE", ... }

// Create a custom theme
const customTokens = createThemeTokens({
  accent: "#FF6B6B",
  text: "#1A1A1A",
  success: "#51CF66",
  // ... other colors
})

// Or extend an existing theme manually
const customTheme = {
  name: "my-theme",
  label: "My Custom Theme",
  light: {
    ...notionClean.light,
    accent: "#FF6B6B",  // Override accent color
  },
  dark: {
    ...notionClean.dark,
    accent: "#FF8787",  // Override dark mode accent
  },
}
```

## Usage with React

Pass a theme to `FlowRunner` or `ThemeProvider` from @flowkit-io/react:

```typescript
import { FlowRunner } from "@flowkit-io/react"
import { notionClean } from "@flowkit-io/themes"

export function App() {
  return (
    <FlowRunner
      flow={myFlow}
      theme={notionClean}
      themeMode="light"
      onSubmit={handleSubmit}
    />
  )
}
```

Or set globally via `ThemeProvider`:

```typescript
import { ThemeProvider } from "@flowkit-io/react"

export function App() {
  return (
    <ThemeProvider theme={notionClean} mode="light">
      <FlowRunner flow={myFlow} onSubmit={handleSubmit} />
    </ThemeProvider>
  )
}
```

## Per-step theme overrides

Steps can override theme tokens individually via the `themeOverride` field in step config:

```typescript
{
  type: "select-cards",
  key: "choice",
  title: "Pick one",
  themeOverride: {
    accent: "#FF6B6B",           // Override accent for this step only
    radiusLg: "12px",            // Override border radius
  },
  options: [...]
}
```

The `partialTokensToCssVars()` utility converts partial overrides to CSS variables.

## CSS variables reference

All tokens are injected as CSS custom properties (variables) prefixed with `--fk-`:

```css
--fk-text            /* Primary text */
--fk-text2           /* Secondary text */
--fk-canvas          /* Background */
--fk-soft            /* Light sections */
--fk-surface         /* Cards/panels */
--fk-border          /* Borders */
--fk-accent          /* Primary action */
--fk-accent-soft     /* Soft accent */
--fk-success         /* Success color */
--fk-success-soft
--fk-warning         /* Warning color */
--fk-warning-soft
--fk-danger          /* Error color */
--fk-danger-soft
--fk-radius-sm       /* 8px */
--fk-radius-md       /* 12px */
--fk-radius-lg       /* 20px */
--fk-radius-xl       /* 24px */
--fk-space-xs        /* 4px */
--fk-space-sm        /* 8px */
--fk-space-md        /* 12px */
--fk-space-lg        /* 16px */
--fk-space-xl        /* 24px */
--fk-space-xxl       /* 32px */
--fk-space-xxxl      /* 48px */
--fk-font-heading    /* Custom font family for headings (if set) */
--fk-font-body       /* Custom font family for body (if set) */
--fk-image-background  /* Background image URL (if set) */
--fk-image-logo      /* Logo image URL (if set) */
```

Use these in custom CSS for step components or flow wrappers:

```css
.my-step {
  color: var(--fk-text);
  background: var(--fk-soft);
  border-radius: var(--fk-radius-lg);
  padding: var(--fk-space-lg);
}
```

## Development and test commands

From the package directory:

```bash
npm run build          # Build with tsup (ESM + TypeScript declarations)
```

From the repo root:

```bash
npm run lint           # Lint all packages
npm run typecheck      # Type-check all packages
npm run test           # Run all tests (unit + integration)
npm run verify:fast    # lint + typecheck + test + build (no e2e)
npm run verify         # lint + typecheck + test + build + e2e
```

## Compatibility and dependencies

- **Runtime:** Node.js 18+ (module: ESM, no side effects)
- **TypeScript:** 5.0+
- **Dependencies:** None
- **Peer dependencies:** None
- **Internal workspace dependencies:** None

The package is framework-agnostic: tokens can be used with React, Vue, Svelte, or vanilla JavaScript. The theme utilities return plain objects and strings.

## Notes

- All built-in themes have light and dark variants ready for use; no configuration needed.
- Font URLs (if provided) must be loaded by the consuming app (e.g., via `<link>` or `@import` in CSS); this package only returns the URLs.
- Background and logo images can be URLs, data URIs, or base64-encoded strings.
- Custom themes should follow the token structure to ensure compatibility with all step components.
- Theme tokens are immutable at runtime; create a new theme object to change appearance.
