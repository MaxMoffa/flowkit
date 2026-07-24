import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

test.use({ viewport: { width: 320, height: 640 } })

test("faces step: options wrap onto a new row on very narrow screens", async ({ page }) => {
  await openPreset(page, { cta: "Segnala un odore →" })

  await page.getByRole("region", { name: "Map" }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()
  await page.locator(".fk-card").first().click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // scale, auto-init
  await page.locator(".fk-chip").first().click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  await expect(page.getByRole("heading", { name: "Quanto è fastidioso?" })).toBeVisible()

  const faces = page.locator(".fk-face")
  await expect(faces).toHaveCount(5)

  const tops = new Set<number>()
  for (const box of await Promise.all((await faces.all()).map((f) => f.boundingBox()))) {
    if (box) tops.add(Math.round(box.y))
  }
  // at 320px width, 5 faces (70px basis + gap) can't fit on one row: expect a wrap
  expect(tops.size).toBeGreaterThan(1)

  // and no horizontal overflow of the row itself
  const rowBox = await page.locator(".fk-faces-row").boundingBox()
  expect(rowBox!.width).toBeLessThanOrEqual(320)
})
