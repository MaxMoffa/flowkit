import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

test("otherOption: free-text 'Altro' on radio + multi-select flows into the review", async ({ page }) => {
  await openPreset(page, { preset: "other-option-demo" })

  // radio step
  await expect(page.getByRole("heading", { name: "Come ci hai trovato?" })).toBeVisible()
  const radioOther = page.locator(".fk-step-radio .fk-list-other")
  await expect(radioOther.locator(".fk-list-other-input")).toHaveCount(0)
  await radioOther.locator("input[type=radio]").check()
  const otherInput = radioOther.locator(".fk-list-other-input")
  await otherInput.fill("Newsletter di un collega")
  // the input stays inside the card, not overflowing the frame
  const inputBox = (await otherInput.boundingBox())!
  const cardBox = (await radioOther.boundingBox())!
  expect(inputBox.x).toBeGreaterThanOrEqual(cardBox.x - 1)
  expect(inputBox.x + inputBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + 1)
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  // multi-select step
  await expect(page.getByRole("heading", { name: /aggiornamenti/ })).toBeVisible()
  await page.locator(".fk-step-multi-select .fk-list-item", { hasText: "Prodotto" }).click()
  const msOther = page.locator(".fk-step-multi-select .fk-list-other")
  await msOther.locator("input[type=checkbox]").check()
  await msOther.locator(".fk-list-other-input").fill("Integrazioni")
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  // review
  await expect(page.getByRole("heading", { name: "Rivedi" })).toBeVisible()
  await expect(
    page.locator(".fk-review-row", { hasText: "Come ci hai trovato?" }),
  ).toContainText("Newsletter di un collega")
  const topicsRow = page.locator(".fk-review-row", { hasText: /aggiornamenti/ })
  await expect(topicsRow).toContainText("Prodotto")
  await expect(topicsRow).toContainText("Integrazioni")
})
