import { test, expect } from "@playwright/test"

test("restaurant preset: completes the full flow end to end", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("restaurant")
  await page.getByRole("button", { name: "Prenota un tavolo →" }).click()

  // branch
  await page.locator(".fk-card").first().click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  // party size
  await page.getByPlaceholder("Es. 4").fill("2")
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  // date-time
  await page.locator("input[type='datetime-local']").fill("2099-01-01T20:00")
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  // seating (chips)
  await page.locator(".fk-chip").first().click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  // occasion (optional select-cards) -> skip
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  // dietary notes (optional notes) -> skip
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  // contact name
  await page.getByPlaceholder("Nome e cognome").fill("Mario Rossi")
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  // contact email
  await page.getByPlaceholder("tuo@email.it").fill("mario@example.com")
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  // contact phone
  await page.getByPlaceholder("Es. 333 1234567").fill("3331234567")
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  // review -> submit
  await expect(page.getByRole("heading", { name: "Controlla la prenotazione" })).toBeVisible()
  await page.getByRole("button", { name: "Invia segnalazione ✓" }).click()

  await expect(page.locator(".fk-step-confirmation")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Prenotazione confermata!" })).toBeVisible()
})
