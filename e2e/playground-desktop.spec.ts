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
   * The footer never prints a plain running-total line anymore (the cart panel is the
   * only place that shows it), and the cart trigger is `position: absolute` against
   * `.fk-footer` itself (see style.css) — so a non-empty cart must not move or resize
   * Indietro/Continua at all: their box has to be pixel-identical to the no-cart case,
   * with the trigger appearing at the footer's own far left edge, independent of them.
   */
  test("cart present: back/continue stay pixel-identical to the no-cart case, cart trigger at the footer's far left", async ({
    page,
  }) => {
    await page.goto("/fullscreen.html?preset=catalog-demo&theme=warm-paper&mode=light")
    await page.getByRole("button", { name: "Desktop (100%)" }).click()
    await page.getByRole("button", { name: "Inizia" }).click()
    await expect(page.getByRole("heading", { name: "Scegli i prodotti" })).toBeVisible()

    const frame = page.locator(".pg-fullscreen-frame")
    const footer = frame.locator(".fk-footer")
    const backBtn = frame.locator(".fk-footer-back")
    const continueBtn = frame.getByRole("button", { name: "Continua", exact: true })

    // Baseline, cart still empty: no trigger, back/continue at their natural position.
    await expect(frame.locator(".fk-footer-cart")).toHaveCount(0)
    const backBefore = (await backBtn.boundingBox())!
    const continueBefore = (await continueBtn.boundingBox())!

    await page
      .locator(".fk-catalog-item", { hasText: "T-shirt FlowKit" })
      .getByRole("button", { name: "Aggiungi" })
      .click()

    await expect(frame.locator(".fk-footer-order-total")).toHaveCount(0)
    const cart = frame.locator(".fk-footer-cart")
    await expect(cart).toBeVisible()

    const footerBox = (await footer.boundingBox())!
    const backAfter = (await backBtn.boundingBox())!
    const continueAfter = (await continueBtn.boundingBox())!
    const cartBox = (await cart.boundingBox())!

    // Sanity check this viewport is actually wide enough for the bug this guards
    // against (row spreading/resizing instead of staying put) to show.
    expect(footerBox.width).toBeGreaterThan(900)

    // Pixel-identical box for both buttons, cart present or not.
    for (const [before, after] of [
      [backBefore, backAfter],
      [continueBefore, continueAfter],
    ] as const) {
      expect(after.x).toBeCloseTo(before.x, 0)
      expect(after.y).toBeCloseTo(before.y, 0)
      expect(after.width).toBeCloseTo(before.width, 0)
      expect(after.height).toBeCloseTo(before.height, 0)
    }
    expect(Math.abs(backAfter.width - continueAfter.width)).toBeLessThanOrEqual(2)

    // Cart sits at the footer's own far left edge (its padding box), well to the left
    // of Indietro — not merely "before" it within the centered reading column.
    expect(cartBox.x - footerBox.x).toBeLessThan(10)
    expect(cartBox.x).toBeLessThan(backAfter.x - 100)
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
