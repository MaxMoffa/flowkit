import { test, expect } from "@playwright/test"

/**
 * On desktop (>=1024px) the cart panel is a contextual popover anchored above the
 * 🛒 trigger — not the centered modal dialog it is below that width (and still is on
 * mobile/tablet, unaffected — see footer-cart-panel.spec.ts, which runs at the
 * default mobile viewport). No dark backdrop; still closes on outside click/Escape.
 */
test.describe("footer cart panel: desktop contextual popover", () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test("opens anchored above the trigger, left-aligned with it, no backdrop dimming", async ({ page }) => {
    await page.goto("/fullscreen.html?preset=catalog-demo&theme=warm-paper&mode=light")
    await page.getByRole("button", { name: "Desktop (100%)" }).click()
    await page.getByRole("button", { name: "Inizia" }).click()
    await expect(page.getByRole("heading", { name: "Scegli i prodotti" })).toBeVisible()

    await page
      .locator(".fk-catalog-item", { hasText: "T-shirt FlowKit" })
      .getByRole("button", { name: "Aggiungi" })
      .click()

    const cartTrigger = page.locator(".fk-footer-cart")
    const cartBox = (await cartTrigger.boundingBox())!

    await cartTrigger.click()
    const panel = page.locator(".fk-cart-sheet")
    await expect(panel).toBeVisible()
    await expect(panel).toContainText("T-shirt FlowKit")

    const panelBox = (await panel.boundingBox())!
    expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(cartBox.y + 1)
    expect(Math.abs(panelBox.x - cartBox.x)).toBeLessThan(5)

    const backdrop = page.locator(".fk-cart-sheet-backdrop")
    const bg = await backdrop.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bg).toBe("rgba(0, 0, 0, 0)")

    // Outside click still closes it (the transparent backdrop still catches clicks).
    await page.mouse.click(900, 300)
    await expect(panel).toHaveCount(0)
  })
})
