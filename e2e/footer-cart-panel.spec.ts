import { test, expect } from "@playwright/test"

/**
 * Minimal coverage for the footer's cart button/panel (this task's #3): the 🛒
 * trigger appears next to Continue exactly when the running order total shows up
 * (catalog-demo's default mobile-width viewport, see playwright.config.ts), opening
 * a drawer with the itemized recap; closes via the ✕.
 */
test("catalog step: cart button opens a panel with the selected items, closes via ✕", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("catalog-demo")
  await page.getByRole("button", { name: "Inizia" }).click()

  await expect(page.getByRole("heading", { name: "Scegli i prodotti" })).toBeVisible()

  // No cart yet: nothing to open.
  await expect(page.locator(".fk-footer-cart")).toHaveCount(0)

  await page
    .locator(".fk-catalog-item", { hasText: "T-shirt FlowKit" })
    .getByRole("button", { name: "Aggiungi" })
    .click()

  // Two render sites exist (mobile row + desktop total block, see flow-footer.tsx);
  // only one is visible at a given viewport width — `:visible` picks whichever CSS
  // shows here instead of hardcoding which of the two that is.
  const cartButton = page.locator(".fk-footer-cart:visible")
  await expect(cartButton).toHaveCount(1)

  await cartButton.click()
  const panel = page.locator(".fk-cart-sheet")
  await expect(panel).toBeVisible()
  await expect(panel).toContainText("T-shirt FlowKit")
  await expect(panel).toContainText("€")

  await page.locator(".fk-cart-sheet-close").click()
  await expect(panel).toHaveCount(0)
})

/**
 * The panel's +/-/remove controls (this task) actually write back to the source
 * `catalog` step, not just to the panel's own view: bumping/removing a line from the
 * panel updates the footer's badge/total, and the change is still there when the
 * panel closes and the source step (still on screen the whole time here) is read
 * directly — proof it wrote to the step's real answer, not some panel-local copy.
 */
test("catalog step: cart panel +/-/remove controls write back to the source step", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("catalog-demo")
  await page.getByRole("button", { name: "Inizia" }).click()
  await expect(page.getByRole("heading", { name: "Scegli i prodotti" })).toBeVisible()

  await page
    .locator(".fk-catalog-item", { hasText: "T-shirt FlowKit" })
    .getByRole("button", { name: "Aggiungi" })
    .click()

  const cartButton = page.locator(".fk-footer-cart:visible")
  await cartButton.click()
  const panel = page.locator(".fk-cart-sheet")
  const panelLine = panel.locator(".fk-cart-summary-line", { hasText: "T-shirt FlowKit" })
  await expect(panelLine.locator(".fk-cart-summary-qty-value")).toHaveText("1")

  // "+" from the panel.
  await panelLine.getByRole("button", { name: "Aumenta la quantità" }).click()
  await expect(panelLine.locator(".fk-cart-summary-qty-value")).toHaveText("2")
  await expect(cartButton.locator(".fk-footer-cart-badge")).toHaveText("2")

  await page.locator(".fk-cart-sheet-close").click()
  // The source step (still the one on screen) reflects the panel's edit.
  await expect(
    page.locator(".fk-catalog-item", { hasText: "T-shirt FlowKit" }).locator(".fk-catalog-qty"),
  ).toHaveText("2")

  // "-" from the panel.
  await cartButton.click()
  await panelLine.getByRole("button", { name: "Riduci la quantità" }).click()
  await expect(panelLine.locator(".fk-cart-summary-qty-value")).toHaveText("1")

  // Remove from the panel: the cart becomes empty (this was the only priced line in
  // the flow so far), so the panel itself closes along with the trigger — same as an
  // explicit ✕ close, just driven by the cart going empty rather than a click on it.
  await panelLine.getByRole("button", { name: "Rimuovi" }).click()
  await expect(panel).toHaveCount(0)
  await expect(page.locator(".fk-footer-cart")).toHaveCount(0)
  await expect(
    page.locator(".fk-catalog-item", { hasText: "T-shirt FlowKit" }).getByRole("button", { name: "Aggiungi" }),
  ).toBeVisible()
})
