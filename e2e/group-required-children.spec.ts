import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

async function openFeaturesDemo(page: import("@playwright/test").Page) {
  await openPreset(page, { preset: "features-demo" })
  for (let i = 0; i < 9; i++) {
    await page.getByRole("button", { name: "Continua", exact: true }).click()
  }
  // satisfy quick-group
  await page.locator(".fk-scale-pill", { hasText: "5" }).click()
  await page.getByRole("button", { name: "Velocità" }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()
  // satisfy pick-radio
  await page.locator(".fk-step-radio .fk-list-item").first().click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()
  // skip pick-title-only, solo-group
  await page.getByRole("button", { name: "Continua", exact: true }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()
}

test("group-and (requiredChildren mode:'all'): both fields must be filled to continue", async ({ page }) => {
  await openFeaturesDemo(page)
  await expect(page.getByRole("heading", { name: "Entrambi i campi richiesti (AND)" })).toBeVisible()

  const continueBtn = page.getByRole("button", { name: "Continua", exact: true })
  await expect(continueBtn).toBeDisabled()

  await page.getByPlaceholder("Campo A").fill("x")
  await expect(continueBtn).toBeDisabled()

  await page.getByPlaceholder("Campo B").fill("y")
  await expect(continueBtn).toBeEnabled()
})

test("group-any (requiredChildren mode:'any'): either field alone unblocks continue", async ({ page }) => {
  await openFeaturesDemo(page)
  await page.getByPlaceholder("Campo A").fill("x")
  await page.getByPlaceholder("Campo B").fill("y")
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  await expect(page.getByRole("heading", { name: "Almeno un campo richiesto (OR)" })).toBeVisible()
  const continueBtn = page.getByRole("button", { name: "Continua", exact: true })
  await expect(continueBtn).toBeDisabled()

  await page.getByPlaceholder("Campo A").fill("x")
  await expect(continueBtn).toBeEnabled()
})

test("group-none (requiredChildren mode:'none'): always enabled", async ({ page }) => {
  await openFeaturesDemo(page)
  await page.getByPlaceholder("Campo A").fill("x")
  await page.getByPlaceholder("Campo B").fill("y")
  await page.getByRole("button", { name: "Continua", exact: true }).click()
  await page.getByPlaceholder("Campo A").fill("x")
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  await expect(page.getByRole("heading", { name: "Nessun campo obbligatorio" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Continua", exact: true })).toBeEnabled()
})
