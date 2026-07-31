import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

test.describe("unified step image field", () => {
  test("kind: emoji renders as text", async ({ page }) => {
    await openPreset(page, { preset: "step-image-demo", start: false })
    const badge = page.locator(".fk-intro-badge")
    await expect(badge).toBeVisible()
    await expect(badge).toHaveText("🎉")
  })

  test("kind: icon renders sanitized inline SVG, adopting currentColor", async ({ page }) => {
    // openPreset's CTA click already lands on the first post-intro step ("icon-step").
    await openPreset(page, { preset: "step-image-demo" })
    const badge = page.locator(".fk-intro-badge")
    const svg = badge.locator("svg")
    await expect(svg).toBeVisible()
    await expect(badge.locator("script")).toHaveCount(0)
    const color = await badge.evaluate((el) => getComputedStyle(el).color)
    expect(color).not.toBe("")
  })

  test("kind: image renders an <img>", async ({ page }) => {
    await openPreset(page, { preset: "step-image-demo", skip: ["icon-step"] })
    const img = page.locator(".fk-intro-badge img")
    await expect(img).toBeVisible()
    const src = await img.getAttribute("src")
    expect(src).toContain("data:image/svg+xml;base64,")
  })

  test("all three kinds stay visible after switching to dark mode", async ({ page }) => {
    await openPreset(page, { preset: "step-image-demo", start: false })
    await page.getByRole("button", { name: "🌙 Scuro" }).click()

    await expect(page.locator(".fk-intro-badge")).toBeVisible()
    await page.getByRole("button", { name: "Prova" }).click()
    await expect(page.locator(".fk-intro-badge svg")).toBeVisible()
  })
})
