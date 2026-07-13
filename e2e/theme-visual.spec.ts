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

test("showcase theme: page background, dotted progress, footer on top", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByLabel("Tema", { exact: true }).selectOption("showcase")
  await page.getByRole("button", { name: "Prova" }).click() // step successivo mostra header/progress/footer

  const bg = await page
    .locator(".pg-frame .fk-root")
    .evaluate((el) => getComputedStyle(el).backgroundImage)
  expect(bg).not.toBe("none")

  await expect(page.locator(".fk-progress-dots")).toBeVisible()
  await expect(page.locator(".fk-progress-track")).toHaveCount(0)

  const headerBox = await page.locator(".pg-frame .fk-header").boundingBox()
  const footerBox = await page.locator(".pg-frame .fk-footer").boundingBox()
  expect(footerBox!.y).toBeLessThan(headerBox!.y)
})

test("showcase theme: step transition applies a slide animation class", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByLabel("Tema", { exact: true }).selectOption("showcase")
  await page.getByRole("button", { name: "Prova" }).click()
  await expect(page.locator(".fk-step-theme-scope")).toHaveClass(/fk-anim-slide/)
})

test("per-step themeOverride: group step accent differs from the flow's theme accent", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  for (let i = 0; i < 8; i++) {
    await page.getByRole("button", { name: "Continua", exact: true }).click()
  }
  await expect(page.getByRole("heading", { name: "Un paio di domande veloci" })).toBeVisible()

  const scopedAccent = await page
    .locator(".fk-step-theme-scope")
    .evaluate((el) => getComputedStyle(el).getPropertyValue("--fk-accent").trim())
  expect(scopedAccent).toBe("#E56458")

  const rootAccent = await page
    .locator(".pg-frame .fk-theme")
    .evaluate((el) => getComputedStyle(el).getPropertyValue("--fk-accent").trim())
  expect(rootAccent).not.toBe("#E56458")
})

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
