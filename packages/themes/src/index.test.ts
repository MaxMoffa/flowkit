import { describe, expect, it } from "vitest"
import { notionClean, themeToCssVars, injectThemeFontLinks, themes } from "./index"
import type { Theme } from "./index"

describe("themes registry", () => {
  it("includes all built-in themes with distinct accents", () => {
    expect(Object.keys(themes)).toEqual([
      "notion-clean",
      "mint-fresh",
      "midnight-ink",
      "sunset-clay",
      "rose-quartz",
      "showcase",
    ])
    const accents = new Set(Object.values(themes).map((t) => t.light.accent))
    expect(accents.size).toBe(Object.keys(themes).length)
  })
})

describe("themeToCssVars", () => {
  it("maps existing tokens without regressions", () => {
    const vars = themeToCssVars(notionClean, "light")
    expect(vars["--fk-accent"]).toBe("#2783DE")
    expect(vars["--fk-radius-md"]).toBe("14px")
  })

  it("does not add font/image vars when tokens are absent", () => {
    const vars = themeToCssVars(notionClean, "light")
    expect(vars["--fk-font-heading"]).toBeUndefined()
    expect(vars["--fk-image-background"]).toBeUndefined()
  })

  it("maps font/image tokens additively when present", () => {
    const theme: Theme = {
      name: "custom",
      label: "Custom",
      light: {
        ...notionClean.light,
        fonts: { heading: "'Fraunces', serif", body: "'Inter', sans-serif" },
        images: { background: "/bg.jpg", logo: "/logo.svg" },
      },
      dark: notionClean.dark,
    }
    const vars = themeToCssVars(theme, "light")
    expect(vars["--fk-font-heading"]).toBe("'Fraunces', serif")
    expect(vars["--fk-font-body"]).toBe("'Inter', sans-serif")
    expect(vars["--fk-image-background"]).toBe('url("/bg.jpg")')
    expect(vars["--fk-image-logo"]).toBe('url("/logo.svg")')
  })
})

describe("injectThemeFontLinks", () => {
  it("returns an empty array when no font URLs are configured", () => {
    expect(injectThemeFontLinks(notionClean, "light")).toEqual([])
  })

  it("returns configured font URLs", () => {
    const theme: Theme = {
      name: "custom",
      label: "Custom",
      light: {
        ...notionClean.light,
        fonts: {
          headingFontUrl: "https://fonts.example/heading.css",
          bodyFontUrl: "https://fonts.example/body.css",
        },
      },
      dark: notionClean.dark,
    }
    expect(injectThemeFontLinks(theme, "light")).toEqual([
      "https://fonts.example/heading.css",
      "https://fonts.example/body.css",
    ])
  })
})
