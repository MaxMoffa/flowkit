import { test, expect } from "@playwright/test"

/**
 * `intro` and `review` never show the cart (trigger or total) even with a non-empty
 * cart — see flow-runner.tsx's `orderSummary`, gated off on both roles: `review` has
 * its own itemized recap, `intro`'s hero CTA shouldn't carry a resumed cart's total
 * as extra chrome. Regression coverage for both: this combination used to cause the
 * footer to squeeze `ctaFootnote` onto the total's row on desktop (see git history) —
 * now moot since neither step ever shows a cart element in the first place, but worth
 * asserting explicitly so a future change to that gating doesn't silently reintroduce
 * a `ctaFootnote` + cart-trigger combination nobody has designed for.
 */
test.describe("footer: cart stays hidden on intro/review even with a resumed cart", () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test("intro: no cart trigger/total, footnote renders normally", async ({ page }) => {
    const initialAnswers = JSON.stringify({ cart: { items: [{ value: "sticker", quantity: 1 }], total: 500 } })
    await page.goto(
      `/fullscreen.html?preset=footer-cart-footnote-demo&theme=warm-paper&mode=light` +
        `&initialAnswers=${encodeURIComponent(initialAnswers)}`,
    )
    await page.getByRole("button", { name: "Desktop (100%)" }).click()

    await expect(page.getByRole("heading", { name: "Footer: carrello + footnote" })).toBeVisible()
    await expect(page.locator(".fk-footer-order-total")).toHaveCount(0)
    await expect(page.locator(".fk-footer-cart")).toHaveCount(0)

    const footnote = page.locator(".fk-footer-note")
    await expect(footnote).toBeVisible()
    await expect(footnote).toContainText("carrello lasciato in sospeso")
  })

  test("review: cart from the catalog step doesn't show in the footer, footnote renders normally", async ({
    page,
  }) => {
    await page.goto("/fullscreen.html?preset=footer-cart-footnote-demo&theme=warm-paper&mode=light")
    await page.getByRole("button", { name: "Desktop (100%)" }).click()
    await page.getByRole("button", { name: "Prova" }).click()

    await expect(page.getByRole("heading", { name: "Scegli un prodotto" })).toBeVisible()
    await page.getByRole("button", { name: "Aggiungi" }).click()
    // Cart shows here (not intro/review): non-empty order, catalog itself isn't gated.
    await expect(page.locator(".fk-footer-cart")).toBeVisible()

    await page.getByRole("button", { name: "Continua", exact: true }).click()

    await expect(page.getByRole("heading", { name: "Rivedi le risposte" })).toBeVisible()
    await expect(page.locator(".fk-footer-order-total")).toHaveCount(0)
    await expect(page.locator(".fk-footer-cart")).toHaveCount(0)

    const footnote = page.locator(".fk-footer-note")
    await expect(footnote).toBeVisible()
    await expect(footnote).toContainText("termini di servizio")
  })
})
