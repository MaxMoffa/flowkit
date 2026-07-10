import { test, expect } from "@playwright/test"

test.describe("odori preset", () => {
  test("completes the full flow end to end", async ({ page }) => {
    await page.goto("/")
    // odori is selected by default
    await page.getByRole("button", { name: "Segnala un odore →" }).click()

    // location: click on the map to pick a point
    await page.getByRole("region", { name: "Map" }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    // select-cards
    await page.locator(".fk-card").first().click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    // scale (slider, auto-initialized)
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    // chips (duration)
    await page.locator(".fk-chip").first().click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    // faces (optional, auto-selected) -> skip
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    // notes-photo (optional) -> skip
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    // review -> submit
    await page.getByRole("button", { name: "Invia segnalazione ✓" }).click()

    await expect(page.locator(".fk-step-confirmation")).toBeVisible()
  })
})

test.describe("feedback preset", () => {
  test("completes the full flow end to end", async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Preset", { exact: true }).selectOption("feedback")
    await page.getByRole("button", { name: "Inizia" }).click()

    // faces (mood)
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    // nps
    await page.locator(".fk-nps-cell").nth(8).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    // multi-select highlights (optional min:0) -> skip
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    // text (email, optional) -> skip
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    // review -> submit
    await page.getByRole("button", { name: "Invia segnalazione ✓" }).click()

    await expect(page.locator(".fk-step-confirmation")).toBeVisible()
  })
})
