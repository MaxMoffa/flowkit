import { test, expect } from "@playwright/test"

test("theme with layout.progressPosition: 'footer' renders the progress bar above the nav row, not in the header", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByLabel("Tema", { exact: true }).selectOption("showcase")
  await page.getByRole("button", { name: "Prova" }).click()

  await expect(page.locator(".fk-footer .fk-progress-dots")).toBeVisible()
  await expect(page.locator(".fk-header .fk-progress-dots")).toHaveCount(0)

  const progress = page.locator(".fk-footer .fk-progress-dots")
  const row = page.locator(".fk-footer .fk-footer-row")
  const progressBox = (await progress.boundingBox())!
  const rowBox = (await row.boundingBox())!
  expect(progressBox.y).toBeLessThan(rowBox.y) // progress sits above back/continue
})
