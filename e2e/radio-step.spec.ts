import { test, expect } from "@playwright/test"

test("radio step: single-select list, one option per row", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  for (let i = 0; i < 8; i++) {
    await page.getByRole("button", { name: "Continua", exact: true }).click()
  }

  // quick-group: satisfy scale + chips to advance to the radio step
  await page.locator(".fk-scale-pill", { hasText: "5" }).click()
  await page.getByRole("button", { name: "Velocità" }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  await expect(page.getByRole("heading", { name: "Come preferisci essere ricontattato?" })).toBeVisible()

  const items = page.locator(".fk-step-radio .fk-list-item")
  await expect(items).toHaveCount(3)

  // one option per row: each item starts to the left of/below the previous one (column stack)
  const first = await items.nth(0).boundingBox()
  const second = await items.nth(1).boundingBox()
  expect(first).not.toBeNull()
  expect(second).not.toBeNull()
  expect(second!.y).toBeGreaterThan(first!.y)
  expect(Math.abs(second!.x - first!.x)).toBeLessThan(2)

  await expect(page.locator(".fk-step-radio input[type='radio']")).toHaveCount(3)

  const continueBtn = page.getByRole("button", { name: "Continua", exact: true })
  await expect(continueBtn).toBeDisabled()

  await items.nth(0).click()
  await expect(items.nth(0)).toHaveClass(/fk-list-item-selected/)
  await expect(items.nth(0).locator("input")).toBeChecked()
  await expect(continueBtn).toBeEnabled()

  // single-select: choosing a second option deselects the first
  await items.nth(1).click()
  await expect(items.nth(1)).toHaveClass(/fk-list-item-selected/)
  await expect(items.nth(1).locator("input")).toBeChecked()
  await expect(items.nth(0)).not.toHaveClass(/fk-list-item-selected/)
  await expect(items.nth(0).locator("input")).not.toBeChecked()
  await expect(continueBtn).toBeEnabled()
})
