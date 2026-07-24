import { test, expect, type Locator, type Page } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

test.use({ viewport: { width: 320, height: 800 } })

async function assertNoHorizontalOverflow(page: Page, locator: Locator) {
  await expect(locator).toBeVisible()
  const overflow = await locator.evaluate((el) => el.scrollWidth - el.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  const box = (await locator.boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1)
}

test("review step: long custom submitLabel wraps instead of overflowing at 320px", async ({ page }) => {
  await openPreset(page, { preset: "button-overflow-demo", start: false })
  await page.getByRole("button", { name: "Inizia" }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // skip note

  const submitBtn = page.locator(".fk-btn-primary.fk-btn-success")
  await assertNoHorizontalOverflow(page, submitBtn)
})

test("confirmation footer: long custom primaryCta/secondaryCta wrap instead of overflowing at 320px", async ({
  page,
}) => {
  await openPreset(page, { preset: "button-overflow-demo", start: false })
  await page.getByRole("button", { name: "Inizia" }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // skip note
  await page.locator(".fk-btn-primary.fk-btn-success").click() // submit review

  await assertNoHorizontalOverflow(page, page.locator(".fk-btn-secondary"))
  await assertNoHorizontalOverflow(page, page.locator(".fk-btn-primary"))
})
