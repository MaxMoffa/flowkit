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
   * only place that shows it) — so a non-empty cart must not change the Indietro/
   * Continua row's layout at all: it stays in the same centered 640px reading column,
   * cart trigger included, exactly like the no-cart case.
   */
  test("cart present: back/continue (+ cart trigger) stay in the centered reading column, no total line", async ({
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
    const row = frame.locator(".fk-footer-row")
    await expect(frame.locator(".fk-footer-order-total")).toHaveCount(0)
    await expect(frame.locator(".fk-footer-cart")).toBeVisible()

    const footerBox = (await footer.boundingBox())!
    const rowBox = (await row.boundingBox())!

    // Sanity check this viewport is actually wide enough for the bug this guards
    // against (row spreading to the real edges instead of staying centered) to show.
    expect(footerBox.width).toBeGreaterThan(900)

    // Centered as a column, not flush to the real (much wider) footer edges.
    const leftGap = rowBox.x - footerBox.x
    const rightGap = footerBox.x + footerBox.width - (rowBox.x + rowBox.width)
    expect(leftGap).toBeGreaterThan(100)
    expect(Math.abs(leftGap - rightGap)).toBeLessThan(5)

    // Cart trigger sits to the left of Indietro (order: -1, see style.css), and
    // Indietro/Continua end up exactly the same width — not squeezed asymmetrically
    // by the trigger sharing their row.
    const cartBox = (await frame.locator(".fk-footer-cart").boundingBox())!
    const backBox = (await frame.locator(".fk-footer-back").boundingBox())!
    const continueBox = (await frame.getByRole("button", { name: "Continua", exact: true }).boundingBox())!
    expect(cartBox.x).toBeLessThan(backBox.x)
    expect(backBox.x).toBeLessThan(continueBox.x)
    expect(Math.abs(backBox.width - continueBox.width)).toBeLessThanOrEqual(2)
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
