import { test, expect } from "@playwright/test"

test.describe("playground fullscreen preview", () => {
  test("opens a standalone page, simulates mobile/tablet/desktop widths, and shows the CTA", async ({
    page,
    context,
  }) => {
    await page.goto("/")

    const [popup] = await Promise.all([
      context.waitForEvent("page"),
      page.getByRole("link", { name: "Anteprima fullscreen" }).click(),
    ])
    await popup.waitForLoadState()

    expect(popup.url()).toContain("/fullscreen.html")

    const frame = popup.locator(".pg-fullscreen-frame")

    await popup.getByRole("button", { name: "Mobile 390px" }).click()
    await expect(frame).toHaveCSS("width", "390px")

    await popup.getByRole("button", { name: "Tablet 768px" }).click()
    await expect(frame).toHaveCSS("width", "768px")

    await popup.getByRole("button", { name: "Desktop (100%)" }).click()
    const frameBox = await frame.evaluate((el) => el.getBoundingClientRect())
    const viewport = popup.viewportSize()!
    expect(frameBox.width).toBeCloseTo(viewport.width, 0)

    const themeBox = await popup.locator(".fk-theme").evaluate((el) => el.getBoundingClientRect())
    expect(themeBox.width).toBeCloseTo(viewport.width, 0)
    expect(themeBox.height).toBeGreaterThan(viewport.height - 60)

    const cta = popup.locator(".fk-footer .fk-btn-primary")
    await expect(cta).toBeVisible()
    const ctaBox = (await cta.boundingBox())!
    expect(ctaBox.y + ctaBox.height).toBeLessThanOrEqual(viewport.height)

    await popup.getByRole("link", { name: "Torna al playground" }).click()
    await popup.waitForURL(/\/(index\.html)?(\?.*)?$|\/$/)
  })
})
