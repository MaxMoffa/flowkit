# Configuring a theme

A theme (`packages/themes/src/index.ts`) has this shape:

```ts
export interface Theme {
  name: string   // unique slug, e.g. "notion-clean"
  label: string  // human-readable label for a selector UI, e.g. "Notion Clean"
  light: ThemeTokens
  dark: ThemeTokens
}
```

`ThemeTokens` (`packages/themes/src/notion-clean.ts`) is the single place where
colors, base measurements and (optionally) fonts/images live:

```ts
export interface ThemeTokens {
  text: string        // primary text color
  text2: string       // secondary text color (subtitles, labels)
  canvas: string      // main background (white/black depending on mode)
  soft: string        // "soft" background for de-emphasized cards/inputs
  surface: string     // background for slightly more marked surfaces (progress track)
  border: string      // border color
  accent: string       // accent color (primary buttons, selections)
  accentSoft: string   // light tint of the accent (badges, selected cards)
  success: string      // semantic green
  successSoft: string
  warning: string      // semantic orange
  warningSoft: string
  danger: string       // semantic red
  dangerSoft: string
  radiusSm: string     // small border radius (e.g. back button, numeric pills)
  radiusMd: string     // medium border radius (cards, buttons, inputs)
  radiusLg: string     // large border radius (map, review box)
  radiusXl: string     // extra border radius (landing badge)
  spacing: Record<"xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl", string>
  fonts?: {              // optional: typography customization
    heading?: string
    body?: string
    headingSize?: string
    bodySize?: string
    headingFontUrl?: string  // URL of a font-face/stylesheet to inject
    bodyFontUrl?: string
  }
  images?: {             // optional: image customization
    background?: string          // global flow background
    stepBackground?: Record<string, string> // background for a specific step id/type
    logo?: string
  }
  layout?: {             // optional: chrome layout (see below)
    headerPosition?: "top" | "bottom"
    footerPosition?: "top" | "bottom"
    progressVariant?: "bar" | "dots" | "hidden" | string
    progressPosition?: "header" | "footer"
  }
  animation?: {          // optional: step transition animation
    name?: "fade" | "slide" | "none" | string
    duration?: number
  }
}
```

These tokens are translated into CSS variables (`--fk-*`) by `themeToCssVars` and
injected inline on the `<ThemeProvider>` container — no CSS-in-JS, no classes
generated at runtime: all the rest of the CSS (`packages/react/src/style.css`) only
reads `var(--fk-*)`. `fonts`/`images`/`layout`/`animation` are additive: if absent, the
CSS behavior is identical to before they were introduced.

## Custom fonts and images

```ts
const myTheme: Theme = {
  name: "brand",
  label: "Brand",
  light: {
    ...notionClean.light,
    fonts: {
      heading: "'Fraunces', serif",
      body: "'Inter', sans-serif",
      headingFontUrl: "https://fonts.example/fraunces.css",
      bodyFontUrl: "https://fonts.example/inter.css",
    },
    images: { background: "/brand-bg.jpg", logo: "/brand-logo.svg" },
  },
  dark: notionClean.dark,
}
```

`@flowkit-io/themes` exposes `injectThemeFontLinks(theme, mode)` (returns the font URLs to
load): the themes package stays framework-agnostic, so actually injecting the
`<link rel="stylesheet">` into the DOM is the host app's responsibility (or a renderer
like `@flowkit-io/react`, in a future version with built-in support).

## Page/step background, header/footer position, progress bar, animations

```ts
const myTheme: Theme = {
  name: "brand",
  label: "Brand",
  light: {
    ...notionClean.light,
    images: {
      background: "/brand-bg.jpg",        // global background for all pages
      stepBackground: { intro: "/brand-hero.jpg" }, // override for a specific step id or type
    },
    layout: {
      headerPosition: "top",    // "top" (default) | "bottom"
      footerPosition: "bottom", // "top" | "bottom" (default)
      progressVariant: "dots",  // "bar" (default) | "dots" | "hidden" | custom key
      progressPosition: "header", // "header" (default) | "footer"
    },
    animation: {
      name: "slide", // "none" (default) | "fade" | "slide" | custom name
      duration: 250,  // ms
    },
  },
  dark: notionClean.dark,
}
```

All optional: a theme that doesn't set them behaves exactly like today. The background
(image or SVG, even as a data-URI) applies behind the cards, which stay opaque.
`progressVariant: "hidden"` only hides the bar, not the back button. A custom variant
registers like step components:

```ts
import { registerProgressComponent } from "@flowkit-io/react"

registerProgressComponent("my-style", ({ pct, currentIndex, total }) => (
  <div>{currentIndex + 1} of {total} ({pct}%)</div>
))
// then: theme.layout.progressVariant = "my-style"
```

`progressPosition: "footer"` moves the progress bar out of the header and into the
footer, rendered above the back/continue row — the footer becomes a single unified
block (progress + navigation) instead of two separate chrome regions. The header still
renders (it hosts the mobile icon-only back button and the `n/m` counter); only the
progress bar itself relocates.

The `"fade"`/`"slide"` animations are ready to use; a different name only applies the
`fk-anim-${name}-enter`/`fk-anim-${name}-dir-next|prev` classes to the step wrapper,
CSS/keyframes to be provided by the host app — same "bring your own CSS" approach as
custom themes.

The **"showcase"** theme (`themes.showcase` / selectable in the playground) shows all
of these features together, for demonstration purposes.

Even a single step can override part of the theme while it's shown, via the common
`themeOverride` field (see [Reference by step type](./steps-reference.md)):

```ts
{ id: "final-quiz", type: "scale", themeOverride: { accent: "#E56458" }, /* ... */ }
```

## Creating a custom theme

No need to modify `@flowkit-io/themes`: just build a compatible `Theme` object and pass
it to `FlowRunner`.

```ts
import type { Theme } from "@flowkit-io/themes"

export const brandTheme: Theme = {
  name: "brand",
  label: "Brand",
  light: {
    text: "#1A1A1A",
    text2: "#6B6B6B",
    canvas: "#FFFFFF",
    soft: "#F7F7F5",
    surface: "#EFEFEC",
    border: "#E2E2DE",
    accent: "#FF5A36",
    accentSoft: "#FFEAE3",
    success: "#2FA35E",
    successSoft: "#E3F5E8",
    warning: "#D89B3C",
    warningSoft: "#FBF0DC",
    danger: "#E0615A",
    dangerSoft: "#FBE6E4",
    radiusSm: "10px",
    radiusMd: "14px",
    radiusLg: "20px",
    radiusXl: "28px",
    spacing: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", xxl: "32px", xxxl: "48px" },
  },
  dark: {
    /* same shape, dark-mode values */
    text: "#F2F2F0", text2: "#A0A0A0", canvas: "#141414", soft: "#1C1C1C",
    surface: "#242424", border: "#333333", accent: "#FF7A5C", accentSoft: "#3A2018",
    success: "#4CCB86", successSoft: "#16301F", warning: "#E4AC5C", warningSoft: "#332815",
    danger: "#EC7B74", dangerSoft: "#332120",
    radiusSm: "10px", radiusMd: "14px", radiusLg: "20px", radiusXl: "28px",
    spacing: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", xxl: "32px", xxxl: "48px" },
  },
}
```

```tsx
<FlowRunner flow={myFlow} theme={brandTheme} mode="light" />
```

If you just want **targeted overrides** without creating a whole theme, you can also
set CSS variables by hand on a container around `FlowRunner`:

```css
.my-wrapper {
  --fk-accent: #ff5a36;
  --fk-radius-md: 10px;
}
```

```tsx
<div className="my-wrapper">
  <FlowRunner flow={myFlow} theme={notionClean} />
</div>
```

## Helpers available in `@flowkit-io/themes`

```ts
themeToCssVars(theme, mode)      // -> Record<"--fk-...", string>, useful for inline style
themeToCssString(theme, mode)    // -> "key: value;\n..." string for a static <style>
injectThemeFontLinks(theme, mode) // -> string[] of font URLs to inject (see above)
```

## Included themes

| `name` | `label` | Palette |
|---|---|---|
| `notion-clean` | Notion Clean | Warm neutral, blue accent `#2783DE` (default) |
| `mint-fresh` | Mint Fresh | Green neutral, emerald green accent `#16A87E` |
| `midnight-ink` | Midnight Ink | Purple-ish neutral, indigo accent `#6753E0` |
| `sunset-clay` | Sunset Clay | Warm neutral, terracotta accent |
| `rose-quartz` | Rose Quartz | Soft neutral, rose accent |
| `showcase` | Showcase (demo) | Demonstrates background image, dots progress in the footer, footer-on-top and slide animation together — not meant for production use |

```ts
import { themes, notionClean, mintFresh, midnightInk } from "@flowkit-io/themes"

Object.entries(themes) // [["notion-clean", notionClean], ["mint-fresh", mintFresh], ...]
```

Back to the [docs index](./README.md).
