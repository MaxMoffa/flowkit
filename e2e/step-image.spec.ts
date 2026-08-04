import { test, expect } from "@playwright/test"
import { openPreset, continueStep } from "./helpers/open-preset"

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

test.describe("step image propagation to non-intro step types (v2.36)", () => {
  test("renders inline next to the title (.fk-title-icon), not the intro/info hero badge", async ({ page }) => {
    await openPreset(page, { preset: "step-image-demo", skip: ["icon-step", "image-step"] })
    // Lands on "select-cards-step", which carries an emoji image.
    const icon = page.locator("h2.fk-title .fk-title-icon")
    await expect(icon).toBeVisible()
    await expect(icon).toHaveText("🎯")
    await expect(page.locator(".fk-intro-badge")).toHaveCount(0)
  })

  test("no icon markup (no empty space) when the step has no image set", async ({ page }) => {
    await openPreset(page, { preset: "step-image-demo", skip: ["icon-step", "image-step"] })
    await page.getByText("X", { exact: true }).click() // select the only option
    await continueStep(page) // select-cards-step -> no-icon-step

    await expect(page.locator("h2.fk-title")).toHaveText("Nessuna icona")
    await expect(page.locator(".fk-title-icon")).toHaveCount(0)
  })

  test("stays visible after switching to dark mode", async ({ page }) => {
    await openPreset(page, { preset: "step-image-demo", skip: ["icon-step", "image-step"] })
    await page.getByRole("button", { name: "🌙 Scuro" }).click()
    await expect(page.locator("h2.fk-title .fk-title-icon")).toBeVisible()
  })
})
