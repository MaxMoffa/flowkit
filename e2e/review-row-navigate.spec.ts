import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

test.describe("review row navigate-and-return", () => {
  test("clicking a review row jumps to the source step, edits, and returns to review", async ({ page }) => {
    await openPreset(page, { preset: "checkpoint-review-demo" })

    await page.locator(".fk-input").fill("Risposta 1")
    await page.getByRole("button", { name: "Continua", exact: true }).click() // q1 -> checkpoint-1
    await page.getByRole("button", { name: "Continua", exact: true }).click() // checkpoint-1 -> q2

    await page.locator(".fk-input").fill("Risposta 2")
    await page.getByRole("button", { name: "Continua", exact: true }).click() // q2 -> sig

    const canvas = page.locator(".fk-signature-canvas")
    const box = (await canvas.boundingBox())!
    await page.mouse.move(box.x + 20, box.y + 20)
    await page.mouse.down()
    await page.mouse.move(box.x + 80, box.y + 60, { steps: 5 })
    await page.mouse.up()
    await page.getByRole("button", { name: "Continua", exact: true }).click() // sig -> final-review

    await expect(page.getByText("Risposta 1")).toBeVisible()

    const sigRow = page.locator(".fk-review-row", { hasText: "Firma qui" })
    await expect(sigRow.getByText("✍️ Firma")).toBeVisible()
    await expect(sigRow.locator("img")).toHaveCount(1)
    const sigSrc = await sigRow.locator("img").getAttribute("src")
    expect(sigSrc).toMatch(/^data:image\/svg\+xml;base64,/)

    const q1Row = page.locator(".fk-review-row", { hasText: "Prima domanda" })
    await q1Row.click()

    // Back on q1, with the previously-entered value precompiled.
    await expect(page.getByRole("heading", { name: "Prima domanda" })).toBeVisible()
    await expect(page.locator(".fk-input")).toHaveValue("Risposta 1")

    await page.locator(".fk-input").fill("Risposta 1 modificata")
    const returnButton = page.getByRole("button", { name: "Torna al riepilogo", exact: true })
    await expect(returnButton).toBeVisible()
    await returnButton.click()

    // Back on the final review, with the row now showing the updated value.
    await expect(page.getByRole("heading", { name: "Rivedi le risposte" })).toBeVisible()
    await expect(page.getByText("Risposta 1 modificata")).toBeVisible()
    await expect(page.getByText("Risposta 1", { exact: true })).toHaveCount(0)
  })
})
