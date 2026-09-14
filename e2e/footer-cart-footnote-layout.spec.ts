import { test, expect } from "@playwright/test"

/**
 * Desktop-only layout bug: with the cart non-empty (running order total shown),
 * `.fk-footer-inner` becomes a `flex-direction: row` container (see style.css,
 * `@container fk-shell (min-width: 1024px)`) so the total and the back/primary row
 * sit side by side. `.fk-footer-note` (a step's `ctaFootnote`) is a plain sibling of
 * both — without a forced full-width flex-basis it would squeeze in as a third item
 * on that same line instead of staying on its own row underneath, and inherits the
 * (otherwise fine) `text-align: center` meant for the no-cart, single-column case.
 *
 * Repro needs a step with both a non-empty cart *and* a `ctaFootnote` — `review`
 * deliberately never shows the running total (it has its own itemized recap), so the
 * only real-world way to get both is `intro` with a resumed cart (e.g. an abandoned
 * checkout), seeded here via the fullscreen preview's debug-only `?initialAnswers=`.
 */
test.describe("footer: cart + ctaFootnote on desktop", () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test("footnote stays on its own row, left-aligned, below the total/buttons row", async ({ page }) => {
    const initialAnswers = JSON.stringify({ cart: { items: [{ value: "sticker", quantity: 1 }], total: 500 } })
    await page.goto(
      `/fullscreen.html?preset=footer-cart-footnote-demo&theme=warm-paper&mode=light` +
        `&initialAnswers=${encodeURIComponent(initialAnswers)}`,
    )
    await page.getByRole("button", { name: "Desktop (100%)" }).click()

    await expect(page.getByRole("heading", { name: "Footer: carrello + footnote" })).toBeVisible()

    const orderTotal = page.locator(".fk-footer-order-total")
    const footerRow = page.locator(".fk-footer-row")
    const footnote = page.locator(".fk-footer-note")
    await expect(orderTotal).toBeVisible()
    await expect(footnote).toBeVisible()

    expect(await footnote.evaluate((el) => getComputedStyle(el).textAlign)).toBe("left")

    const totalBox = (await orderTotal.boundingBox())!
    const rowBox = (await footerRow.boundingBox())!
    const noteBox = (await footnote.boundingBox())!
    // Below both the total and the back/primary row, not squeezed onto their line.
    expect(noteBox.y).toBeGreaterThanOrEqual(totalBox.y + totalBox.height - 1)
    expect(noteBox.y).toBeGreaterThanOrEqual(rowBox.y + rowBox.height - 1)
    // Left-aligned: starts near the footer's left edge, not centered in it.
    const innerBox = (await page.locator(".fk-footer-inner").boundingBox())!
    expect(noteBox.x).toBeLessThan(innerBox.x + 40)
  })
})
