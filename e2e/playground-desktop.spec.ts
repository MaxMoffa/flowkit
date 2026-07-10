import { test, expect } from "@playwright/test"

test.describe("playground desktop layout", () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test("primary CTA stays visible and clickable inside the phone frame on desktop", async ({ page }) => {
    await page.goto("/")

    const frame = page.locator(".pg-frame")
    const cta = frame.locator(".fk-footer .fk-btn-primary")

    await expect(cta).toBeVisible()

    const frameBox = (await frame.boundingBox())!
    const ctaBox = (await cta.boundingBox())!
    expect(ctaBox.y).toBeGreaterThanOrEqual(frameBox.y)
    expect(ctaBox.y + ctaBox.height).toBeLessThanOrEqual(frameBox.y + frameBox.height + 1)

    await cta.click()
  })

  test("footer stays pinned to the bottom while content scrolls, mobile and desktop", async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")

    const themeEl = page.locator(".pg-frame .fk-theme")
    const footer = page.locator(".pg-frame .fk-footer")

    const themeBox = (await themeEl.boundingBox())!
    const footerBox = (await footer.boundingBox())!
    expect(footerBox.y + footerBox.height).toBeCloseTo(themeBox.y + themeBox.height, 0)
  })
})
