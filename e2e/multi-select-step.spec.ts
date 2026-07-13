import { test, expect } from "@playwright/test"

test("multi-select step: one option per row, large tap targets, independent toggling", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("feedback")
  await page.getByRole("button", { name: "Inizia" }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // faces (mood)
  await page.locator(".fk-nps-cell").nth(8).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // nps

  await expect(page.getByRole("heading", { name: "Cosa ti è piaciuto di più?" })).toBeVisible()

  const items = page.locator(".fk-step-multi-select .fk-list-item")
  await expect(items).toHaveCount(4)

  // one option per row: each item sits below the previous one, same left edge (column stack)
  const first = await items.nth(0).boundingBox()
  const second = await items.nth(1).boundingBox()
  expect(first).not.toBeNull()
  expect(second).not.toBeNull()
  expect(second!.y).toBeGreaterThan(first!.y)
  expect(Math.abs(second!.x - first!.x)).toBeLessThan(2)

  // large, easily tappable rows (min 44px per common a11y guidance)
  for (let i = 0; i < 4; i++) {
    const box = await items.nth(i).boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }

  // independent multi-toggle, unlike radio: selecting a second option keeps the first selected
  await items.nth(0).click()
  await expect(items.nth(0)).toHaveClass(/fk-list-item-selected/)
  await expect(items.nth(0).locator("input")).toBeChecked()

  await items.nth(1).click()
  await expect(items.nth(1)).toHaveClass(/fk-list-item-selected/)
  await expect(items.nth(0)).toHaveClass(/fk-list-item-selected/)
  await expect(items.nth(0).locator("input")).toBeChecked()

  // deselecting one leaves the other selected
  await items.nth(0).click()
  await expect(items.nth(0)).not.toHaveClass(/fk-list-item-selected/)
  await expect(items.nth(0).locator("input")).not.toBeChecked()
  await expect(items.nth(1)).toHaveClass(/fk-list-item-selected/)
})
