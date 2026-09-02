import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

test("payment-stripe step: renders in the flow, stays navigable (deferred, required:false)", async ({
  page,
}) => {
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

  await expect(page.getByRole("heading", { name: "Firma qui" })).toBeVisible()
  const canvasBox = (await page.locator(".fk-signature-canvas").boundingBox())!
  await page.mouse.move(canvasBox.x + 20, canvasBox.y + 20)
  await page.mouse.down()
  await page.mouse.move(canvasBox.x + 80, canvasBox.y + 60, { steps: 5 })
  await page.mouse.up()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // pick-signature

  await expect(page.getByRole("heading", { name: "Completa il pagamento" })).toBeVisible()
  await expect(page.getByText("Ordine demo")).toBeVisible()
  // Deferred model: the step only collects a method (Stripe Payment Element), it never
  // charges here. Either the theme-coloured circular spinner or the loaded Element is
  // present inside the step.
  await expect(page.locator(".fk-step-payment-stripe")).toBeVisible()
  // required: false — the flow stays navigable whether or not a method is picked.
  await expect(page.getByRole("button", { name: "Continua", exact: true })).toBeEnabled()
})
