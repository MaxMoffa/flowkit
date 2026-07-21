import { test, expect } from "@playwright/test"

test("notes+photo group: both optional steps render independently and are skippable", async ({ page }) => {
  await page.goto("/")
  // odori is selected by default
  await page.getByRole("button", { name: "Segnala un odore →" }).click()

  await page.getByRole("region", { name: "Map" }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()
  await page.locator(".fk-card").first().click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // scale, auto-init
  await page.locator(".fk-chip").first().click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // faces, optional, skip

  await expect(page.getByRole("heading", { name: "Vuoi aggiungere altro?" })).toBeVisible()
  const continueBtn = page.getByRole("button", { name: "Continua", exact: true })
  await expect(continueBtn).toBeEnabled() // both children optional -> skippable

  await page.getByPlaceholder("Es. l'odore aumenta quando tira vento da nord…").fill("Molto forte stamattina")
  await expect(page.getByText("Aggiungi una foto")).toBeVisible()
  await expect(continueBtn).toBeEnabled()

  // the gap between the notes textarea and the media control below it shouldn't
  // compound the group's own item gap with the textarea's standalone bottom margin
  const textareaBox = await page.locator(".fk-textarea").boundingBox()
  const mediaBox = await page.locator(".fk-group-item").nth(1).boundingBox()
  expect(mediaBox!.y - (textareaBox!.y + textareaBox!.height)).toBeLessThanOrEqual(20)

  await continueBtn.click()
  await expect(page.getByRole("heading", { name: "Tutto pronto?" })).toBeVisible()
})
