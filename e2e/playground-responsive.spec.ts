import { test, expect } from "@playwright/test"

test("fullscreen preview: desktop 1024px centers step content in a readable column", async ({ page }) => {
  await page.goto("/fullscreen.html?preset=odori&theme=notion-clean&mode=light")
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.getByRole("button", { name: "Desktop 1024px" }).click()

  const frame = page.locator(".pg-fullscreen-frame")
  await expect(frame).toBeVisible()

  const scrollInner = frame.locator(".fk-scroll-inner").first()
  const scrollBox = await scrollInner.boundingBox()
  const frameBox = await frame.boundingBox()
  expect(scrollBox).not.toBeNull()
  expect(frameBox).not.toBeNull()

  // centered: roughly equal empty space on both sides of the content column
  const leftGap = scrollBox!.x - frameBox!.x
  const rightGap = frameBox!.x + frameBox!.width - (scrollBox!.x + scrollBox!.width)
  expect(Math.abs(leftGap - rightGap)).toBeLessThan(4)

  // narrower than the full frame: it's a readable column, not full-bleed
  expect(scrollBox!.width).toBeLessThan(frameBox!.width - 100)
})

test("fullscreen preview: desktop (100%) does not artificially constrain a fullContainer map step", async ({
  page,
}) => {
  await page.goto("/fullscreen.html?preset=features-demo&theme=notion-clean&mode=light")
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.getByRole("button", { name: "Prova" }).click()
  await page.getByRole("button", { name: "Continua senza account" }).click()
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: "Continua", exact: true }).click()
  }
  await expect(page.getByRole("heading", { name: "Mappa a schermo intero (maplibre)" })).toBeVisible()

  const root = page.locator(".fk-step-location--full")
  const frame = page.locator(".pg-fullscreen-frame")
  const rootBox = await root.boundingBox()
  const frameBox = await frame.boundingBox()
  expect(rootBox!.width).toBeGreaterThan(frameBox!.width - 4)
})

test("small phone viewport (~320px): no horizontal overflow, CTA reachable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto("/")

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth)
  expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1)

  const cta = page.locator(".pg-frame .fk-footer .fk-btn-primary")
  await expect(cta).toBeVisible()
  const box = await cta.boundingBox()
  expect(box!.width).toBeGreaterThan(0)
})
