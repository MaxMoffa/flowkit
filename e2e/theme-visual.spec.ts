import { test, expect } from "@playwright/test"

const themes = ["notion-clean", "mint-fresh", "midnight-ink", "sunset-clay", "rose-quartz"] as const

for (const theme of themes) {
  test(`intro screen renders consistently for theme "${theme}"`, async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Tema", { exact: true }).selectOption(theme)
    await expect(page.locator(".pg-phone")).toHaveScreenshot(`odori-intro-${theme}.png`, {
      maxDiffPixelRatio: 0.02,
    })
  })
}

test("theme selector and swatch strip include all registered themes", async ({ page }) => {
  await page.goto("/")
  const select = page.getByLabel("Tema", { exact: true })
  for (const theme of themes) {
    await expect(select.locator(`option[value="${theme}"]`)).toHaveCount(1)
  }
  for (const theme of ["sunset-clay", "rose-quartz"]) {
    await select.selectOption(theme)
    const accent = await page
      .locator(".pg-frame .fk-theme")
      .evaluate((el) => getComputedStyle(el).getPropertyValue("--fk-accent").trim())
    expect(accent.length).toBeGreaterThan(0)
  }
})
