import { test, expect } from "@playwright/test"

/**
 * The `catalog` step's tax estimate (see DECISIONS.md "Tassazione: stima IP-based
 * pre-checkout"): before the flow's own `address` step is answered, `calculateTax`
 * falls back to `FlowRunnerProps.estimatedAddress` — here stood in for the platform's
 * server-side IP geolocation via the playground's debug `?estimatedCountry=` param
 * (see apps/playground/src/app.tsx).
 */

test("catalog step: shows an estimated tax note once an item is added, using estimatedAddress", async ({
  page,
}) => {
  await page.goto("/?estimatedCountry=IT")
  await page.getByLabel("Preset", { exact: true }).selectOption("catalog-demo")
  await page.getByRole("button", { name: "Inizia" }).click()

  await expect(page.getByRole("heading", { name: "Scegli i prodotti" })).toBeVisible()
  await page
    .locator(".fk-catalog-item", { hasText: "T-shirt FlowKit" })
    .getByRole("button", { name: "Aggiungi" })
    .click()

  const note = page.locator(".fk-catalog-tax-note")
  // The mock `calculateTax` (catalog-demo.tsx) simulates ~500ms of network latency —
  // `toContainText` polls past the "Calcolo delle imposte…" loading text on its own.
  await expect(note).toContainText("stima")
  await expect(note).toContainText("€")
})

test("catalog step: no tax note without an estimatedAddress (nothing to estimate from yet)", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("catalog-demo")
  await page.getByRole("button", { name: "Inizia" }).click()

  await expect(page.getByRole("heading", { name: "Scegli i prodotti" })).toBeVisible()
  await page
    .locator(".fk-catalog-item", { hasText: "T-shirt FlowKit" })
    .getByRole("button", { name: "Aggiungi" })
    .click()

  // No address step answer yet and no estimatedAddress fallback — buildTaxInput can't
  // build an input at all, so calculateTax never fires (not even a loading flash).
  await page.waitForTimeout(300)
  await expect(page.locator(".fk-catalog-tax-note")).toHaveCount(0)
})

// The review step's own "· stima" caveat once a real `address` answer supersedes the
// estimate — and `buildTaxInput` preferring the collected address either way — are
// covered at the unit level (core/tax.test.ts, react/steps/review.test.tsx): reaching
// it here would mean actually filling in the catalog-demo's Stripe Payment Element
// first (its payment step is `required: true`), unrelated to what this spec covers.
