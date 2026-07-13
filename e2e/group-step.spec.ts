import { test, expect } from "@playwright/test"

test("group step: renders child steps inline and aggregates answers", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  for (let i = 0; i < 8; i++) {
    await page.getByRole("button", { name: "Continua", exact: true }).click()
  }

  await expect(page.getByRole("heading", { name: "Un paio di domande veloci" })).toBeVisible()
  await expect(page.getByText("Quanto sei soddisfatto?")).toBeVisible()
  await expect(page.getByText("Cosa ti è piaciuto?")).toBeVisible()

  const continueBtn = page.getByRole("button", { name: "Continua", exact: true })
  await expect(continueBtn).toBeDisabled()

  await page.locator(".fk-scale-pill", { hasText: "5" }).click()
  await expect(continueBtn).toBeDisabled() // scale risposta, ma manca chips (required di default)

  await page.getByRole("button", { name: "Velocità" }).click()
  await expect(continueBtn).toBeEnabled()
})
