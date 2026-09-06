import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

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
    await openPreset(page, { preset: "features-demo", start: false })

    const themeEl = page.locator(".pg-frame .fk-theme")
    const footer = page.locator(".pg-frame .fk-footer")

    const themeBox = (await themeEl.boundingBox())!
    const footerBox = (await footer.boundingBox())!
    expect(footerBox.y + footerBox.height).toBeCloseTo(themeBox.y + themeBox.height, 0)
  })

  test("the footer's back+primary row never overflows the frame, even at a desktop viewport", async ({
    page,
  }) => {
    await openPreset(page, { preset: "features-demo", start: false })
    await page.locator(".pg-frame .fk-footer .fk-btn-primary").click()

    const frame = page.locator(".pg-frame")
    const row = page.locator(".pg-frame .fk-footer-row")
    const frameBox = (await frame.boundingBox())!
    const rowBox = (await row.boundingBox())!
    expect(rowBox.x).toBeGreaterThanOrEqual(frameBox.x)
    expect(rowBox.x + rowBox.width).toBeLessThanOrEqual(frameBox.x + frameBox.width + 1)
  })
})

test.describe("desktop flow navigation (fullscreen preview, true full width)", () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test("progress bar spans the full width and back moves into the footer row next to primary", async ({
    page,
  }) => {
    await page.goto("/fullscreen.html?preset=features-demo&theme=warm-paper&mode=light")
    await page.getByRole("button", { name: "Desktop (100%)" }).click()
    await page.getByRole("button", { name: "Prova" }).click()

    const frame = page.locator(".pg-fullscreen-frame")
    const header = frame.locator(".fk-header")
    await expect(header).toBeVisible()

    // the header's own back button hides on desktop...
    await expect(frame.locator(".fk-header .fk-back")).toBeHidden()

    // ...and a text-only secondary back button appears in the footer instead
    const footerBack = frame.locator(".fk-footer-back")
    const primary = frame.locator(".fk-footer .fk-btn-primary")
    await expect(footerBack).toBeVisible()
    await expect(footerBack).toHaveText(/Indietro/)

    const backBox = (await footerBack.boundingBox())!
    const primaryBox = (await primary.boundingBox())!
    expect(Math.abs(backBox.y - primaryBox.y)).toBeLessThan(4) // same row
    expect(backBox.x).toBeLessThan(primaryBox.x) // secondary left, primary right
    expect(Math.abs(backBox.width - primaryBox.width)).toBeLessThanOrEqual(3) // equal width

    const backBorder = await footerBack.evaluate((el) => getComputedStyle(el).borderWidth)
    expect(backBorder).not.toBe("0px") // recognizable as a button, not a bare text link

    // the progress bar spans (essentially) the full header width, not a narrow column
    const track = frame.locator(".fk-progress-track")
    const trackBox = (await track.boundingBox())!
    const headerBox = (await header.boundingBox())!
    expect(trackBox.width).toBeGreaterThan(headerBox.width - 150)
  })

  /**
   * Regression for the footer-squeeze bug: with a cart total present, the
   * [🛒+total] / [Indietro/Continua] group used to stay centered inside the same
   * 640px reading column as the step content, leaving large empty margins on both
   * sides of the footer bar instead of using them. `.fk-footer-inner:has(.fk-footer-
   * order-total)` now drops the reading-column cap so the group sits near the real
   * left/right edges of the footer instead. See style.css `@container fk-shell
   * (min-width: 1024px)`.
   */
  test("cart total + buttons use the real footer width instead of a centered 640px column", async ({
    page,
  }) => {
    await page.goto("/fullscreen.html?preset=catalog-demo&theme=warm-paper&mode=light")
    await page.getByRole("button", { name: "Desktop (100%)" }).click()
    await page.getByRole("button", { name: "Inizia" }).click()
    await expect(page.getByRole("heading", { name: "Scegli i prodotti" })).toBeVisible()

    await page
      .locator(".fk-catalog-item", { hasText: "T-shirt FlowKit" })
      .getByRole("button", { name: "Aggiungi" })
      .click()

    const frame = page.locator(".pg-fullscreen-frame")
    const footer = frame.locator(".fk-footer")
    const cartGroup = frame.locator(".fk-footer-order-total")
    const row = frame.locator(".fk-footer-row")
    await expect(cartGroup).toBeVisible()

    const footerBox = (await footer.boundingBox())!
    const cartGroupBox = (await cartGroup.boundingBox())!
    const rowBox = (await row.boundingBox())!

    // Sanity check this viewport is actually wide enough for the bug to matter.
    expect(footerBox.width).toBeGreaterThan(900)

    // Cart+total group sits close to the footer's real left edge — nowhere near the
    // middle, which is where a still-centered 640px column would put it.
    const leftGap = cartGroupBox.x - footerBox.x
    expect(leftGap).toBeLessThan(60)
    expect(leftGap).toBeLessThan(footerBox.width / 4)

    // Indietro/Continua sit close to the footer's real right edge...
    const rightGap = footerBox.x + footerBox.width - (rowBox.x + rowBox.width)
    expect(rightGap).toBeLessThan(60)

    // ...without ballooning to fill all the freed-up space themselves: real empty
    // space remains between the total and the buttons.
    const middleGap = rowBox.x - (cartGroupBox.x + cartGroupBox.width)
    expect(middleGap).toBeGreaterThan(100)
  })

  test("clicking the footer back button navigates to the previous step", async ({ page }) => {
    await page.goto("/fullscreen.html?preset=features-demo&theme=warm-paper&mode=light")
    await page.getByRole("button", { name: "Desktop (100%)" }).click()
    await page.getByRole("button", { name: "Prova" }).click()

    await expect(page.getByRole("heading", { name: "Accedi per continuare" })).toBeVisible()
    await page.getByRole("button", { name: "Continua senza account" }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()
    await expect(page.getByRole("heading", { name: "Scegli un punto sulla mappa" })).toBeVisible()

    await page.locator(".fk-footer-back").click()
    await expect(page.getByRole("heading", { name: "Accedi per continuare" })).toBeVisible()
  })
})
