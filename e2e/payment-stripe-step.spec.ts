import { test, expect } from "@playwright/test"

test("payment-stripe step: renders config, surfaces createPaymentIntent failure without crashing", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
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
  // No real backend in this public demo: createPaymentIntent deliberately rejects,
  // the step must surface that as an error message instead of crashing/hanging forever.
  await expect(page.getByText("Nessun backend di pagamento configurato in questa demo.")).toBeVisible()
  // required: false — the flow must remain navigable even though payment never succeeds.
  await expect(page.getByRole("button", { name: "Continua", exact: true })).toBeEnabled()
})
