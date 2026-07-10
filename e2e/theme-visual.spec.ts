import { test, expect } from "@playwright/test"

const themes = ["notion-clean", "mint-fresh", "midnight-ink"] as const

for (const theme of themes) {
  test(`intro screen renders consistently for theme "${theme}"`, async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Tema", { exact: true }).selectOption(theme)
    await expect(page.locator(".pg-phone")).toHaveScreenshot(`odori-intro-${theme}.png`, {
      maxDiffPixelRatio: 0.02,
    })
  })
}
