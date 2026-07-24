import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

async function openSignatureStep(page: import("@playwright/test").Page) {
  await openPreset(page, { preset: "features-demo" })
  for (let i = 0; i < 9; i++) {
    await page.getByRole("button", { name: "Continua", exact: true }).click()
  }
  await page.locator(".fk-scale-pill", { hasText: "5" }).click()
  await page.getByRole("button", { name: "Velocità" }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()
  await page.locator(".fk-step-radio .fk-list-item").first().click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "Continua", exact: true }).click() // skip pick-title-only, solo-group
  }
  await page.getByPlaceholder("Campo A").fill("x")
  await page.getByPlaceholder("Campo B").fill("y")
  await page.getByRole("button", { name: "Continua", exact: true }).click() // group-and
  await page.getByPlaceholder("Campo A").fill("x")
  await page.getByRole("button", { name: "Continua", exact: true }).click() // group-any
  await page.getByRole("button", { name: "Continua", exact: true }).click() // group-none
}

async function drawStroke(page: import("@playwright/test").Page) {
  const canvas = page.locator(".fk-signature-canvas")
  const box = (await canvas.boundingBox())!
  await page.mouse.move(box.x + 20, box.y + 20)
  await page.mouse.down()
  await page.mouse.move(box.x + 80, box.y + 60, { steps: 5 })
  await page.mouse.move(box.x + 140, box.y + 20, { steps: 5 })
  await page.mouse.up()
}

test("signature step: drawing enables Continua, undo/clear reset it", async ({ page }) => {
  await openSignatureStep(page)
  await expect(page.getByRole("heading", { name: "Firma qui" })).toBeVisible()

  const continueBtn = page.getByRole("button", { name: "Continua", exact: true })
  await expect(continueBtn).toBeDisabled()

  await drawStroke(page)
  await expect(continueBtn).toBeEnabled()

  await page.getByRole("button", { name: "Annulla" }).click()
  await expect(continueBtn).toBeDisabled()

  await drawStroke(page)
  await expect(continueBtn).toBeEnabled()
  await page.getByRole("button", { name: "Cancella" }).click()
  await expect(continueBtn).toBeDisabled()
})

test("signature step: fullscreen toggle covers the viewport and keeps the drawing", async ({ page }) => {
  await openSignatureStep(page)
  await drawStroke(page)

  await page.getByRole("button", { name: "Schermo intero" }).click()
  await expect(page.locator(".fk-step-signature--full")).toBeVisible()

  const continueBtn = page.getByRole("button", { name: "Continua", exact: true })
  await expect(continueBtn).toBeEnabled()

  await page.getByRole("button", { name: "Chiudi" }).click()
  await expect(page.locator(".fk-step-signature--full")).toHaveCount(0)
  await expect(continueBtn).toBeEnabled()
})
