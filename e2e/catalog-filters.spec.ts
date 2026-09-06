import { test, expect } from "@playwright/test"

/**
 * The `catalog` step's optional filter-chip row (see DECISIONS.md "Catalog: filtri a
 * faccette"): `catalog-demo`'s "cart" step configures 3 filters (Bestseller/Eco/Novità)
 * over items carrying `tags`. Filter state is local UI state, so this only checks
 * which items are visible — not the eventual answer/order total.
 */

test("catalog step: activating a filter shows only matching items, deselecting restores the full list", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("catalog-demo")
  await page.getByRole("button", { name: "Inizia" }).click()

  await expect(page.getByRole("heading", { name: "Scegli i prodotti" })).toBeVisible()
  await expect(page.locator(".fk-catalog-item")).toHaveCount(4)

  const bestsellerChip = page.getByRole("button", { name: "Bestseller" })
  await bestsellerChip.click()
  await expect(bestsellerChip).toHaveAttribute("aria-pressed", "true")

  // catalog-demo: only "T-shirt FlowKit" and "Tazza" carry the "bestseller" tag.
  await expect(page.locator(".fk-catalog-item")).toHaveCount(2)
  await expect(page.locator(".fk-catalog-item", { hasText: "T-shirt FlowKit" })).toBeVisible()
  await expect(page.locator(".fk-catalog-item", { hasText: "Tazza" })).toBeVisible()
  await expect(page.locator(".fk-catalog-item", { hasText: "Set di adesivi" })).toHaveCount(0)

  await bestsellerChip.click()
  await expect(bestsellerChip).toHaveAttribute("aria-pressed", "false")
  await expect(page.locator(".fk-catalog-item")).toHaveCount(4)
})
