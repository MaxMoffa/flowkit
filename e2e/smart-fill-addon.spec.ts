import { test, expect } from "@playwright/test"
import { openPreset, continueStep } from "./helpers/open-preset"

test.describe("smartFill step add-on", () => {
  async function fillSourceSteps(page: import("@playwright/test").Page) {
    await openPreset(page, { preset: "smart-fill-demo", cta: "Inizia" })

    await page.locator(".fk-input").fill("Mario") // nome
    await continueStep(page)
    await page.locator(".fk-input").fill("Rossi") // cognome
    await continueStep(page)
    await page.getByLabel("Maschio").check() // sesso
    await continueStep(page)
    await page.locator('input[type="date"]').fill("1980-01-01") // data di nascita
    await continueStep(page)
    await page.getByRole("button", { name: "Roma" }).click() // luogo di nascita
    await continueStep(page)
  }

  test("auto-fills the suggested codice fiscale and shows the hint", async ({ page }) => {
    await fillSourceSteps(page)

    const input = page.locator(".fk-input")
    await expect(input).toHaveValue("RSSMRA80A01H501U")
    await expect(page.locator(".fk-smartfill-hint")).toBeVisible()
  })

  test("keeps a manual override after navigating back and changing a source answer", async ({ page }) => {
    await fillSourceSteps(page)

    const input = page.locator(".fk-input")
    await expect(input).toHaveValue("RSSMRA80A01H501U")
    await input.fill("CUSTOM1234567890")
    await expect(page.locator(".fk-smartfill-hint")).toBeHidden()

    // Back to "luogo di nascita" (1), then "data di nascita" (2) to change the source date.
    const back = page.locator(".fk-back:visible, .fk-footer-back:visible")
    await back.click()
    await back.click()
    await page.locator('input[type="date"]').fill("1990-05-05")
    await continueStep(page) // -> luogo di nascita
    await continueStep(page) // -> codice fiscale (selection unchanged)

    await expect(input).toHaveValue("CUSTOM1234567890")
  })
})
