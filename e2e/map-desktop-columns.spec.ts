import { test, expect } from "@playwright/test"

test.use({ viewport: { width: 1280, height: 900 } })

test("map step (maplibre): desktop two-column layout has equal-height columns", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // skip oauth

  await expect(page.getByRole("heading", { name: "Scegli un punto sulla mappa" })).toBeVisible()

  const controls = page.locator(".fk-location-controls")
  const map = page.locator(".fk-map-canvas")
  await expect(controls).toBeVisible()
  await expect(map).toBeVisible()

  const controlsBox = await controls.boundingBox()
  const mapBox = await map.boundingBox()
  expect(controlsBox).not.toBeNull()
  expect(mapBox).not.toBeNull()
  expect(Math.abs((controlsBox!.height) - (mapBox!.height))).toBeLessThanOrEqual(2)
})

test("location-leaflet step: desktop two-column layout has equal-height columns", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  for (let i = 0; i < 7; i++) {
    await page.getByRole("button", { name: "Continua", exact: true }).click()
  }

  await expect(page.getByRole("heading", { name: "Scegli un punto sulla mappa (Leaflet)" })).toBeVisible()

  const controls = page.locator(".fk-location-controls")
  const map = page.locator(".fk-map-canvas")
  await expect(controls).toBeVisible()
  await expect(map).toBeVisible()

  const controlsBox = await controls.boundingBox()
  const mapBox = await map.boundingBox()
  expect(controlsBox).not.toBeNull()
  expect(mapBox).not.toBeNull()
  expect(Math.abs((controlsBox!.height) - (mapBox!.height))).toBeLessThanOrEqual(2)
})
