import { test, expect } from "@playwright/test"

test.describe("playground fullscreen preview", () => {
  test("opens fullscreen, simulates mobile/tablet/desktop widths, then closes", async ({ page }) => {
    await page.goto("/")

    await page.getByRole("button", { name: "Anteprima fullscreen" }).click()

    const overlay = page.locator(".pg-fullscreen-overlay")
    await expect(overlay).toBeVisible()

    const frame = page.locator(".pg-fullscreen-frame")

    await page.getByRole("button", { name: "Mobile 390px" }).click()
    await expect(frame).toHaveCSS("width", "390px")

    await page.getByRole("button", { name: "Tablet 768px" }).click()
    await expect(frame).toHaveCSS("width", "768px")

    await page.getByRole("button", { name: "Desktop (100%)" }).click()
    const desktopWidth = await frame.evaluate((el) => el.getBoundingClientRect().width)
    expect(desktopWidth).toBeGreaterThan(768)

    await page.getByRole("button", { name: "Chiudi anteprima fullscreen" }).click()
    await expect(overlay).not.toBeVisible()
  })
})
