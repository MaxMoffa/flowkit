import { test, expect } from "@playwright/test"

test("date-time step: datetime-local input with disablePast min", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("restaurant")
  await page.getByRole("button", { name: "Prenota un tavolo →" }).click()

  // branch (select-cards)
  await page.locator(".fk-card").first().click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  // party size (text/number)
  await page.getByPlaceholder("Es. 4").fill("2")
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  await expect(page.getByRole("heading", { name: "Quando?" })).toBeVisible()
  const input = page.locator("input[type='datetime-local']")
  await expect(input).toBeVisible()

  const continueBtn = page.getByRole("button", { name: "Continua", exact: true })
  await expect(continueBtn).toBeDisabled()

  const min = await input.getAttribute("min")
  expect(min).toBeTruthy()

  await input.fill("2099-01-01T20:00")
  await expect(continueBtn).toBeEnabled()
})
