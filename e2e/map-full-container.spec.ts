import { test, expect } from "@playwright/test"

test("map step: fullContainer (maplibre) renders map edge-to-edge with floating overlays", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: "Continua", exact: true }).click()
  }

  await expect(page.getByRole("heading", { name: "Mappa a schermo intero (maplibre)" })).toBeVisible()

  const root = page.locator(".fk-step-location--full")
  await expect(root).toBeVisible()

  const top = root.locator(".fk-map-overlay-top")
  const bottom = root.locator(".fk-map-overlay-bottom")
  const map = root.locator(".fk-map-canvas--full")
  await expect(top).toBeVisible()
  await expect(bottom).toBeVisible()
  await expect(map).toBeVisible()
  await expect(top.getByPlaceholder("Cerca un indirizzo")).toBeVisible()
  await expect(bottom.getByRole("button", { name: /Usa la mia posizione/ })).toBeVisible()

  const rootBox = await root.boundingBox()
  const mapBox = await map.boundingBox()
  expect(rootBox).not.toBeNull()
  expect(mapBox).not.toBeNull()
  // edge-to-edge: the map covers (essentially) the full step width/height, not a small inset canvas
  expect(mapBox!.width).toBeGreaterThan(rootBox!.width - 2)
  expect(mapBox!.height).toBeGreaterThan(rootBox!.height - 2)
})

test("map step: fullContainer (leaflet) renders map edge-to-edge with floating overlays", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  for (let i = 0; i < 8; i++) {
    await page.getByRole("button", { name: "Continua", exact: true }).click()
  }

  await expect(page.getByRole("heading", { name: "Mappa a schermo intero", exact: true })).toBeVisible()

  const root = page.locator(".fk-step-location--full")
  await expect(root).toBeVisible()

  const top = root.locator(".fk-map-overlay-top")
  const bottom = root.locator(".fk-map-overlay-bottom")
  const map = root.locator(".fk-map-canvas--full")
  await expect(top).toBeVisible()
  await expect(bottom).toBeVisible()
  await expect(map).toBeVisible()

  const rootBox = await root.boundingBox()
  const mapBox = await map.boundingBox()
  expect(rootBox).not.toBeNull()
  expect(mapBox).not.toBeNull()
  expect(mapBox!.width).toBeGreaterThan(rootBox!.width - 2)
  expect(mapBox!.height).toBeGreaterThan(rootBox!.height - 2)
})

test("map step: fullContainer GPS button is an icon-only control that shares a row with the detected-location card", async ({
  page,
}) => {
  await page.goto("/fullscreen.html?preset=features-demo&theme=notion-clean&mode=light")
  await page.getByRole("button", { name: "Desktop (100%)" }).click()
  await page.getByRole("button", { name: "Prova" }).click()
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: "Continua", exact: true }).click()
  }

  const root = page.locator(".fk-step-location--full")
  const gpsButton = root.getByRole("button", { name: "Usa la mia posizione" })
  await expect(gpsButton).toBeVisible()
  // icon-only: the accessible name comes from aria-label, not visible text
  await expect(gpsButton.locator(".fk-gps-btn-label")).toBeHidden()

  await root.getByRole("region", { name: "Map" }).click()
  const resultRow = root.locator(".fk-map-bottom-actions .fk-loc-row")
  await expect(resultRow).toBeVisible()

  const gpsBox = (await gpsButton.boundingBox())!
  const resultBox = (await resultRow.boundingBox())!
  expect(Math.abs(gpsBox.y - resultBox.y)).toBeLessThan(20) // same row, not stacked
})

test("map step: fullContainer stays usable on a short (landscape-phone) viewport", async ({ page }) => {
  await page.setViewportSize({ width: 667, height: 360 })
  await page.goto("/fullscreen.html?preset=features-demo&theme=notion-clean&mode=light")
  await page.getByRole("button", { name: "Desktop (100%)" }).click()
  await page.getByRole("button", { name: "Prova" }).click()
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: "Continua", exact: true }).click()
  }

  const root = page.locator(".fk-step-location--full")
  await root.locator(".fk-map-canvas--full").click()

  const resultRow = root.locator(".fk-map-bottom-actions .fk-loc-row")
  await expect(resultRow).toBeVisible()

  // the bottom overlay and the "Continua" CTA must both stay on-screen, not pushed
  // below the fold by the map step's normal (larger) min-height floor
  const overlayBottom = root.locator(".fk-map-overlay-bottom")
  const overlayBox = (await overlayBottom.boundingBox())!
  const cta = page.locator(".fk-footer .fk-btn-primary")
  const ctaBox = (await cta.boundingBox())!
  expect(overlayBox.y).toBeGreaterThanOrEqual(0)
  expect(overlayBox.y + overlayBox.height).toBeLessThanOrEqual(360)
  expect(ctaBox.y + ctaBox.height).toBeLessThanOrEqual(360)
})
