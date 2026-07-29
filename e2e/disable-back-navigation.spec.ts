import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

test.describe("flow.disableBack", () => {
  test("hides the back button, disables review shortcuts, and blocks the browser back button", async ({
    page,
  }) => {
    await openPreset(page, { preset: "disable-back-demo" })

    await expect(page.getByRole("heading", { name: "Prima domanda" })).toBeVisible()
    await expect(page.locator(".fk-back")).toHaveCount(0)
    await expect(page.locator(".fk-footer-back")).toHaveCount(0)

    await page.locator(".fk-input").fill("Risposta 1")
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    await expect(page.getByRole("heading", { name: "Seconda domanda" })).toBeVisible()
    await expect(page.locator(".fk-back")).toHaveCount(0)
    await expect(page.locator(".fk-footer-back")).toHaveCount(0)

    // The browser's own back button must not leave the current step.
    await page.goBack()
    await expect(page.getByRole("heading", { name: "Seconda domanda" })).toBeVisible()

    await page.locator(".fk-input").fill("Risposta 2")
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    // Final review: rows are shown but not clickable shortcuts back to earlier steps.
    await expect(page.getByRole("heading", { name: "Rivedi le risposte" })).toBeVisible()
    await expect(page.locator(".fk-review-row-clickable")).toHaveCount(0)
    await page.locator(".fk-review-row", { hasText: "Prima domanda" }).click()
    await expect(page.getByRole("heading", { name: "Rivedi le risposte" })).toBeVisible()
  })
})
