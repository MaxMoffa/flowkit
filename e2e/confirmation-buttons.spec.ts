import { test, expect } from "@playwright/test"

test.describe("confirmation footer buttons", () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test("desktop: secondary and primary buttons sit side by side in one row", async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Preset", { exact: true }).selectOption("result-actions-demo")
    await page.getByRole("button", { name: "Prova" }).click()
    await page.locator(".fk-scale-pill", { hasText: "5" }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    await expect(page.getByRole("heading", { name: "Grazie!" })).toBeVisible()

    const secondary = page.locator(".fk-footer .fk-footer-row .fk-btn-secondary")
    const primary = page.locator(".fk-footer .fk-footer-row .fk-btn-primary")
    await expect(secondary).toBeVisible()
    await expect(primary).toBeVisible()

    const secondaryBox = (await secondary.boundingBox())!
    const primaryBox = (await primary.boundingBox())!
    expect(Math.abs(secondaryBox.y - primaryBox.y)).toBeLessThan(4) // same row
    expect(secondaryBox.x).toBeLessThan(primaryBox.x) // secondary left, primary right
    expect(secondaryBox.height).toBeGreaterThanOrEqual(48) // not squashed
    expect(primaryBox.height).toBeGreaterThanOrEqual(48)
  })

  test("showHomeButton: false hides the primary button, secondary fills the row", async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Preset", { exact: true }).selectOption("file-step-demo")
    await page.getByRole("button", { name: "Prova" }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    await expect(page.getByRole("heading", { name: "Grazie!" })).toBeVisible()
    await expect(page.locator(".fk-footer .fk-btn-secondary")).toBeVisible()
    await expect(page.locator(".fk-footer .fk-btn-primary")).toHaveCount(0)
  })

  test("homeUrl: primary button navigates instead of resetting in-app state", async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Preset", { exact: true }).selectOption("result-actions-demo")
    await page.getByRole("button", { name: "Prova" }).click()
    await page.locator(".fk-scale-pill", { hasText: "5" }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    await expect(page.getByRole("heading", { name: "Grazie!" })).toBeVisible()
    await page.getByRole("button", { name: "Torna alla home" }).click()
    await page.waitForURL(/\?home=1/)
  })
})

test.describe("confirmation footer buttons (mobile)", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test("mobile: buttons stack vertically with full height", async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Preset", { exact: true }).selectOption("result-actions-demo")
    await page.getByRole("button", { name: "Prova" }).click()
    await page.locator(".fk-scale-pill", { hasText: "5" }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    const secondary = page.locator(".fk-footer .fk-footer-row .fk-btn-secondary")
    const primary = page.locator(".fk-footer .fk-footer-row .fk-btn-primary")
    const secondaryBox = (await secondary.boundingBox())!
    const primaryBox = (await primary.boundingBox())!
    expect(primaryBox.y).toBeGreaterThan(secondaryBox.y) // stacked, primary below secondary
    expect(secondaryBox.height).toBeGreaterThanOrEqual(48)
    expect(primaryBox.height).toBeGreaterThanOrEqual(48)
  })
})
