import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

test.describe("checkpoint review step", () => {
  test("mid-flow checkpoint recaps without submitting; final review still submits", async ({ page }) => {
    await openPreset(page, { preset: "checkpoint-review-demo" })

    await page.locator(".fk-input").fill("Risposta uno")
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    // Checkpoint review: shows q1's answer, but its primary button is a plain
    // "Continua" (not the submit label) and clicking it does not reach confirmation.
    await expect(page.getByText("Prima domanda")).toBeVisible()
    await expect(page.getByText("Risposta uno")).toBeVisible()
    await expect(page.getByRole("button", { name: "Invia segnalazione", exact: false })).toHaveCount(0)
    const checkpointPrimary = page.getByRole("button", { name: "Continua", exact: true })
    await expect(checkpointPrimary).not.toHaveClass(/fk-btn-success/)
    await checkpointPrimary.click()

    // Lands on q2, not on confirmation.
    await expect(page.locator(".fk-step-confirmation")).toHaveCount(0)
    await expect(page.getByRole("heading", { name: "Seconda domanda" })).toBeVisible()

    await page.locator(".fk-input").fill("Risposta due")
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    // Final review: both answers shown, primary button is the real submit action.
    await expect(page.getByText("Prima domanda")).toBeVisible()
    await expect(page.getByText("Risposta uno")).toBeVisible()
    await expect(page.getByText("Seconda domanda")).toBeVisible()
    await expect(page.getByText("Risposta due")).toBeVisible()
    const finalSubmit = page.getByRole("button", { name: "Invia segnalazione ✓", exact: true })
    await expect(finalSubmit).toHaveClass(/fk-btn-success/)

    await finalSubmit.click()
    await expect(page.locator(".fk-step-confirmation")).toBeVisible()
  })
})
