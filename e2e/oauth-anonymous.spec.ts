import { test, expect } from "@playwright/test"

test("oauth step: custom provider icon and anonymous skip", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()

  await expect(page.getByRole("heading", { name: "Accedi per continuare" })).toBeVisible()
  const providerButton = page.getByRole("button", { name: /Continua con generic/ })
  await expect(providerButton.getByText("🪪")).toBeVisible()

  const anonymousButton = page.getByRole("button", { name: "Continua senza account" })
  await expect(anonymousButton).toBeVisible()
  await anonymousButton.click()

  await expect(page.getByRole("button", { name: /Continui in anonimo/ })).toBeVisible()
  await expect(page.getByRole("button", { name: "Continua", exact: true })).toBeEnabled()
})
